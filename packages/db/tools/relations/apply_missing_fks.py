#!/usr/bin/env python3
"""
Generate and apply missing FK constraints to the database.

Reads the gap analysis from introspection, filters out false positives,
resolves "unknown" targets manually, and produces ALTER TABLE statements.

Usage:
    python apply_missing_fks.py --dry-run   # Print SQL only
    python apply_missing_fks.py --apply      # Execute against DB
"""

from __future__ import annotations

import sys
import psycopg

# ── FK Definitions ──────────────────────────────────────────────────────
# Each entry: (source_schema, source_table, source_col, target_schema, target_table, target_col, nullable)
# `nullable` determines onDelete behavior: nullable=True → SET NULL, nullable=False → RESTRICT

MISSING_FKS: list[tuple[str, str, str, str, str, str, bool]] = [
    # ── benefits ──
    ("benefits", "benefit_enrollments", "employeeId", "hr", "employees", "employeeId", False),
    ("benefits", "claims_records", "employeeId", "hr", "employees", "employeeId", False),
    ("benefits", "dependent_coverages", "dependentId", "hr", "dependents", "dependentId", False),

    # ── hr.employees (core refs) ──
    ("hr", "employees", "personId", "hr", "persons", "personId", False),
    ("hr", "employees", "departmentId", "hr", "departments", "departmentId", True),
    ("hr", "employees", "positionId", "hr", "positions", "positionId", True),

    # ── hr.departments ──
    ("hr", "departments", "headEmployeeId", "hr", "employees", "employeeId", True),

    # ── hr.positions ──
    ("hr", "positions", "departmentId", "hr", "departments", "departmentId", True),
    ("hr", "positions", "jobRoleId", "hr", "job_roles", "jobRoleId", True),
    ("hr", "positions", "jobGradeId", "hr", "job_grades", "jobGradeId", True),

    # ── hr.attendance_logs (same-schema refs) ──
    ("hr", "attendance_logs", "shiftAssignmentId", "hr", "shift_assignments", "shiftAssignmentId", True),
    ("hr", "attendance_logs", "timesheetId", "hr", "timesheets", "timesheetId", True),

    # ── hr.leave_requests ──
    ("hr", "leave_requests", "leaveTypeId", "hr", "leave_types", "leaveTypeId", False),
    ("hr", "leave_requests", "leaveBalanceId", "hr", "leave_balances", "leaveBalanceId", True),

    # ── hr.leave_balances ──
    ("hr", "leave_balances", "employeeId", "hr", "employees", "employeeId", False),

    # ── hr.timesheets ──
    ("hr", "timesheets", "employeeId", "hr", "employees", "employeeId", False),

    # ── hr.shift_assignments ──
    ("hr", "shift_assignments", "employeeId", "hr", "employees", "employeeId", False),

    # ── hr.absence_records ──
    ("hr", "absence_records", "employeeId", "hr", "employees", "employeeId", False),

    # ── hr.overtime_records ──
    ("hr", "overtime_records", "employeeId", "hr", "employees", "employeeId", False),

    # ── hr.shift_swaps (non-standard naming → employees) ──
    ("hr", "shift_swaps", "requestingEmployeeId", "hr", "employees", "employeeId", False),
    ("hr", "shift_swaps", "targetEmployeeId", "hr", "employees", "employeeId", False),

    # ── hr.employment ──
    ("hr", "employment_contracts", "employeeId", "hr", "employees", "employeeId", False),
    ("hr", "employment_status_history", "employeeId", "hr", "employees", "employeeId", False),
    ("hr", "position_assignments", "employeeId", "hr", "employees", "employeeId", False),
    ("hr", "position_assignments", "positionId", "hr", "positions", "positionId", False),
    ("hr", "probation_records", "employeeId", "hr", "employees", "employeeId", False),
    ("hr", "notice_period_records", "employeeId", "hr", "employees", "employeeId", False),
    ("hr", "reporting_lines", "employeeId", "hr", "employees", "employeeId", False),
    ("hr", "reporting_lines", "managerId", "hr", "employees", "employeeId", False),
    ("hr", "secondments", "employeeId", "hr", "employees", "employeeId", False),
    ("hr", "secondments", "hostDepartmentId", "hr", "departments", "departmentId", True),
    ("hr", "secondments", "hostLocationId", "core", "locations", "locationId", True),
    ("hr", "secondments", "hostLegalEntityId", "core", "legal_entities", "legalEntityId", True),

    # ── hr.employee_transfers ──
    ("hr", "employee_transfers", "employeeId", "hr", "employees", "employeeId", False),
    ("hr", "employee_transfers", "fromDepartmentId", "hr", "departments", "departmentId", True),
    ("hr", "employee_transfers", "toDepartmentId", "hr", "departments", "departmentId", True),
    ("hr", "employee_transfers", "fromLocationId", "core", "locations", "locationId", True),
    ("hr", "employee_transfers", "toLocationId", "core", "locations", "locationId", True),
    ("hr", "employee_transfers", "fromPositionId", "hr", "positions", "positionId", True),
    ("hr", "employee_transfers", "toPositionId", "hr", "positions", "positionId", True),

    # ── hr.selfservice ──
    ("hr", "asset_assignments", "employeeId", "hr", "employees", "employeeId", False),
    ("hr", "document_requests", "employeeId", "hr", "employees", "employeeId", False),
    ("hr", "employee_declarations", "employeeId", "hr", "employees", "employeeId", False),
    ("hr", "service_requests", "employeeId", "hr", "employees", "employeeId", False),

    # ── learning (cross-schema to hr + talent) ──
    ("learning", "assessments", "employeeId", "hr", "employees", "employeeId", False),
    ("learning", "certification_awards", "employeeId", "hr", "employees", "employeeId", False),
    ("learning", "certification_awards", "certificationId", "talent", "certifications", "certificationId", False),
    ("learning", "course_enrollments", "employeeId", "hr", "employees", "employeeId", False),
    ("learning", "learning_path_assignments", "employeeId", "hr", "employees", "employeeId", False),
    ("learning", "trainers", "employeeId", "hr", "employees", "employeeId", True),
    ("learning", "training_enrollments", "employeeId", "hr", "employees", "employeeId", False),
    ("learning", "training_feedback", "employeeId", "hr", "employees", "employeeId", False),

    # ── payroll (cross-schema to hr) ──
    ("payroll", "bank_accounts", "employeeId", "hr", "employees", "employeeId", False),
    ("payroll", "compensation_packages", "employeeId", "hr", "employees", "employeeId", False),
    ("payroll", "expense_claims", "employeeId", "hr", "employees", "employeeId", False),
    ("payroll", "final_settlements", "employeeId", "hr", "employees", "employeeId", False),
    ("payroll", "loan_records", "employeeId", "hr", "employees", "employeeId", False),
    ("payroll", "payroll_entries", "employeeId", "hr", "employees", "employeeId", False),
    ("payroll", "payslips", "employeeId", "hr", "employees", "employeeId", False),
    ("payroll", "social_insurance_profiles", "employeeId", "hr", "employees", "employeeId", False),
    ("payroll", "tax_profiles", "employeeId", "hr", "employees", "employeeId", False),

    # ── recruitment (cross-schema to hr) ──
    ("recruitment", "candidates", "personId", "hr", "persons", "personId", True),
    ("recruitment", "candidates", "convertedEmployeeId", "hr", "employees", "employeeId", True),
    ("recruitment", "exit_interviews", "employeeId", "hr", "employees", "employeeId", False),
    ("recruitment", "exit_interviews", "conductedByEmployeeId", "hr", "employees", "employeeId", True),
    ("recruitment", "interviews", "interviewerId", "hr", "employees", "employeeId", False),
    ("recruitment", "job_requisitions", "positionId", "hr", "positions", "positionId", True),
    ("recruitment", "job_requisitions", "departmentId", "hr", "departments", "departmentId", True),
    ("recruitment", "job_requisitions", "hiringManagerId", "hr", "employees", "employeeId", True),
    ("recruitment", "offboarding_checklists", "employeeId", "hr", "employees", "employeeId", False),
    ("recruitment", "offer_letters", "positionId", "hr", "positions", "positionId", True),
    ("recruitment", "onboarding_checklists", "employeeId", "hr", "employees", "employeeId", False),
    ("recruitment", "probation_evaluations", "employeeId", "hr", "employees", "employeeId", False),
    ("recruitment", "probation_evaluations", "evaluatorId", "hr", "employees", "employeeId", False),

    # ── security ──
    ("security", "user_permissions", "userId", "security", "users", "userId", False),

    # ── talent (cross-schema to hr) ──
    ("talent", "competency_frameworks", "positionId", "hr", "positions", "positionId", True),
    ("talent", "competency_frameworks", "jobRoleId", "hr", "job_roles", "jobRoleId", True),
    ("talent", "disciplinary_actions", "employeeId", "hr", "employees", "employeeId", False),
    ("talent", "disciplinary_actions", "witnessId", "hr", "employees", "employeeId", True),
    ("talent", "employee_certifications", "employeeId", "hr", "employees", "employeeId", False),
    ("talent", "employee_skills", "employeeId", "hr", "employees", "employeeId", False),
    ("talent", "grievance_records", "employeeId", "hr", "employees", "employeeId", False),
    ("talent", "grievance_records", "againstEmployeeId", "hr", "employees", "employeeId", True),
    ("talent", "performance_goals", "employeeId", "hr", "employees", "employeeId", False),
    ("talent", "performance_reviews", "employeeId", "hr", "employees", "employeeId", False),
    ("talent", "performance_reviews", "reviewerId", "hr", "employees", "employeeId", False),
    ("talent", "promotion_records", "employeeId", "hr", "employees", "employeeId", False),
    ("talent", "promotion_records", "fromPositionId", "hr", "positions", "positionId", True),
    ("talent", "promotion_records", "toPositionId", "hr", "positions", "positionId", True),
    ("talent", "promotion_records", "fromGradeId", "hr", "job_grades", "jobGradeId", True),
    ("talent", "promotion_records", "toGradeId", "hr", "job_grades", "jobGradeId", True),
    ("talent", "succession_plans", "positionId", "hr", "positions", "positionId", False),
    ("talent", "succession_plans", "incumbentId", "hr", "employees", "employeeId", True),
    ("talent", "succession_plans", "successorId", "hr", "employees", "employeeId", False),
    ("talent", "talent_pool_memberships", "employeeId", "hr", "employees", "employeeId", False),

    # ── Domain-specific *By FKs (NOT createdBy/updatedBy — those are audit metadata) ──
    ("benefits", "claims_records", "reviewedBy", "hr", "employees", "employeeId", True),
    ("hr", "absence_records", "recordedBy", "hr", "employees", "employeeId", True),
    ("hr", "asset_assignments", "issuedBy", "hr", "employees", "employeeId", True),
    ("hr", "document_requests", "processedBy", "hr", "employees", "employeeId", True),
    ("hr", "employee_declarations", "verifiedBy", "hr", "employees", "employeeId", True),
    ("hr", "employee_transfers", "approvedBy", "hr", "employees", "employeeId", True),
    ("hr", "employment_status_history", "changedBy", "hr", "employees", "employeeId", True),
    ("hr", "notice_period_records", "approvedBy", "hr", "employees", "employeeId", True),
    ("hr", "overtime_records", "approvedBy", "hr", "employees", "employeeId", True),
    ("hr", "probation_records", "reviewedBy", "hr", "employees", "employeeId", True),
    ("hr", "secondments", "approvedBy", "hr", "employees", "employeeId", True),
    ("hr", "shift_swaps", "approvedBy", "hr", "employees", "employeeId", True),
    ("hr", "timesheets", "approvedBy", "hr", "employees", "employeeId", True),
    ("learning", "course_enrollments", "assignedBy", "hr", "employees", "employeeId", True),
    ("learning", "training_enrollments", "approvedBy", "hr", "employees", "employeeId", True),
    ("payroll", "expense_claims", "approvedBy", "hr", "employees", "employeeId", True),
    ("payroll", "final_settlements", "approvedBy", "hr", "employees", "employeeId", True),
    ("payroll", "final_settlements", "processedBy", "hr", "employees", "employeeId", True),
    ("payroll", "loan_records", "approvedBy", "hr", "employees", "employeeId", True),
    ("payroll", "payroll_runs", "approvedBy", "hr", "employees", "employeeId", True),
    ("payroll", "payroll_runs", "processedBy", "hr", "employees", "employeeId", True),
    ("recruitment", "job_requisitions", "approvedBy", "hr", "employees", "employeeId", True),
    ("recruitment", "offer_letters", "approvedBy", "hr", "employees", "employeeId", True),
    ("talent", "disciplinary_actions", "issuedBy", "hr", "employees", "employeeId", False),
    ("talent", "employee_certifications", "verifiedBy", "hr", "employees", "employeeId", True),
    ("talent", "employee_skills", "assessedBy", "hr", "employees", "employeeId", True),
    ("talent", "grievance_records", "resolvedBy", "hr", "employees", "employeeId", True),
    ("talent", "promotion_records", "approvedBy", "hr", "employees", "employeeId", True),
    ("talent", "talent_pool_memberships", "nominatedBy", "hr", "employees", "employeeId", True),
]

# ── False positives (columns ending in "Id" that are NOT FK references) ──
# audit.audit_trail.actorId         → polymorphic actor (user OR service principal)
# audit.audit_trail.correlationId   → UUID correlation ID
# audit.audit_trail.requestId       → UUID request ID
# audit.audit_trail.targetActorId   → polymorphic
# audit.audit_trail.sessionId       → text session identifier
# core.legal_entities.taxId         → tax identification number
# hr.dependents.nationalId          → national identity number
# security.service_principals.clientId → OAuth client ID string
# talent.case_links.sourceId/targetId → polymorphic record references


def _camel_to_snake(name: str) -> str:
    import re
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


def generate_sql() -> str:
    """Generate ALTER TABLE ADD CONSTRAINT SQL for all missing FKs."""
    lines = [
        "-- Auto-generated: missing FK constraints",
        f"-- Total: {len(MISSING_FKS)} constraints",
        "",
    ]

    for src_s, src_t, src_c, tgt_s, tgt_t, tgt_c, nullable in MISSING_FKS:
        col_snake = _camel_to_snake(src_c)
        tgt_col_snake = _camel_to_snake(tgt_c)
        fk_name = f"fk_{src_t}_{col_snake}"
        on_delete = "SET NULL" if nullable else "RESTRICT"

        lines.append(
            f'ALTER TABLE "{src_s}"."{src_t}" '
            f'ADD CONSTRAINT "{fk_name}" '
            f'FOREIGN KEY ("{src_c}") '
            f'REFERENCES "{tgt_s}"."{tgt_t}"("{tgt_c}") '
            f"ON DELETE {on_delete} ON UPDATE CASCADE;"
        )

    lines.append("")
    return "\n".join(lines)


def check_existing(conn: psycopg.Connection) -> list[tuple[str, str, str, str, str, str, bool]]:
    """Return only FKs that don't already exist in the DB."""
    cur = conn.cursor()
    cur.execute("""
        SELECT tc.table_schema, tc.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema IN ('core','security','audit','hr','payroll','benefits','talent','learning','recruitment')
    """)
    existing = {(r[0], r[1], r[2]) for r in cur.fetchall()}

    missing = []
    for fk in MISSING_FKS:
        src_s, src_t, src_c = fk[0], fk[1], fk[2]
        if (src_s, src_t, src_c) not in existing:
            missing.append(fk)
    return missing


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Apply missing FK constraints")
    parser.add_argument("--dry-run", action="store_true", help="Print SQL only")
    parser.add_argument("--apply", action="store_true", help="Execute against DB")
    parser.add_argument("--conn", default="postgresql://postgres:postgres@localhost:5433/afenda_test")
    args = parser.parse_args()

    conn = psycopg.connect(args.conn)

    actually_missing = check_existing(conn)
    print(f"Total defined: {len(MISSING_FKS)}")
    print(f"Already exist: {len(MISSING_FKS) - len(actually_missing)}")
    print(f"To create:     {len(actually_missing)}")
    print()

    if not actually_missing:
        print("All FK constraints already exist. Nothing to do.")
        conn.close()
        return

    # Generate SQL for only truly missing ones
    statements = []
    for src_s, src_t, src_c, tgt_s, tgt_t, tgt_c, nullable in actually_missing:
        col_snake = _camel_to_snake(src_c)
        fk_name = f"fk_{src_t}_{col_snake}"
        on_delete = "SET NULL" if nullable else "RESTRICT"
        statements.append(
            f'ALTER TABLE "{src_s}"."{src_t}" '
            f'ADD CONSTRAINT "{fk_name}" '
            f'FOREIGN KEY ("{src_c}") '
            f'REFERENCES "{tgt_s}"."{tgt_t}"("{tgt_c}") '
            f"ON DELETE {on_delete} ON UPDATE CASCADE;"
        )

    sql = "\n".join(statements)

    if args.dry_run or not args.apply:
        print("-- SQL to execute:")
        print(sql)
        if not args.apply:
            print("\nRun with --apply to execute.")
    
    if args.apply:
        print("\nApplying constraints...")
        errors = []
        with conn.cursor() as cur:
            for i, stmt in enumerate(statements):
                try:
                    cur.execute(stmt)
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    errors.append((stmt, str(e)))
                    print(f"  ERROR: {e}")
                    print(f"    SQL: {stmt[:100]}...")
        
        ok = len(statements) - len(errors)
        print(f"\nDone: {ok} applied, {len(errors)} errors")
        if errors:
            print("\nFailed statements:")
            for stmt, err in errors:
                print(f"  {stmt[:80]}...")
                print(f"    → {err}")

    conn.close()


if __name__ == "__main__":
    main()
