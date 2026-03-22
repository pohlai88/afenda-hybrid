"""
Domain configuration: maps PostgreSQL schema names to filesystem paths,
TypeScript variable names, and import conventions used by AFENDA-HYBRID.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import PurePosixPath


# ── PostgreSQL schema → Drizzle domain mapping ──────────────────────────

@dataclass(frozen=True)
class DomainConfig:
    """Describes one Drizzle domain directory relative to packages/db/src/."""
    pg_schema: str
    ts_dir: str  # relative to packages/db/src/, e.g. "schema-platform/core"
    relations_var: str  # exported const name, e.g. "coreRelations"


DOMAINS: list[DomainConfig] = [
    DomainConfig("core",        "schema-platform/core",       "coreRelations"),
    DomainConfig("security",    "schema-platform/security",   "securityRelations"),
    DomainConfig("audit",       "schema-platform/audit",      "auditRelations"),
    DomainConfig("hr",          "schema-hrm/hr",              "hrRelations"),
    DomainConfig("payroll",     "schema-hrm/payroll",         "payrollRelations"),
    DomainConfig("benefits",    "schema-hrm/benefits",        "benefitsRelations"),
    DomainConfig("talent",      "schema-hrm/talent",          "talentRelations"),
    DomainConfig("learning",    "schema-hrm/learning",        "learningRelations"),
    DomainConfig("recruitment", "schema-hrm/recruitment",     "recruitmentRelations"),
]

DOMAIN_BY_SCHEMA: dict[str, DomainConfig] = {d.pg_schema: d for d in DOMAINS}


# ── FK gap tool: intentionally non-referential *Id columns ───────────────
# Used by `cli.py fk-gaps` to suppress false positives: polymorphic refs,
# opaque identifiers (tax / national id), OAuth client UUIDs, trace IDs, etc.
# Tuple: (pg_schema, pg_table, pg_column) — column names as stored in PostgreSQL
# (AFENDA uses quoted camelCase identifiers in migrations, e.g. "actorId").
INTENTIONAL_NON_FK_COLUMNS: frozenset[tuple[str, str, str]] = frozenset(
    {
        # Polymorphic / multi-target audit context (see auditTrail.ts comments)
        ("audit", "audit_trail", "actorId"),
        ("audit", "audit_trail", "targetActorId"),
        ("audit", "audit_trail", "correlationId"),  # UUID trace, not a row FK
        ("audit", "audit_trail", "requestId"),  # UUID request id, not a row FK
        ("audit", "audit_trail", "sessionId"),  # opaque session token / string
        # Audience ref depends on audience_type (department/location/role/user)
        ("core", "announcement_audiences", "audienceRefId"),
        # Polymorphic attachment (ref_schema, ref_table, ref_id)
        ("core", "attachments", "refId"),
        # Business registration / tax identifier (text), not a surrogate FK
        ("core", "legal_entities", "taxId"),
        # Polymorphic notification back-reference
        ("core", "notifications", "referenceId"),
        # Polymorphic workflow subject (record_table + record_id)
        ("core", "workflow_instances", "recordId"),
        # National ID document number (text column name ends with …Id pattern)
        ("hr", "dependents", "nationalId"),
        # OAuth-style client UUID; not references(another_table)
        ("security", "service_principals", "clientId"),
        # Polymorphic case graph (source_type + source_id, target_type + target_id)
        ("talent", "case_links", "sourceId"),
        ("talent", "case_links", "targetId"),
    }
)


# ── Table-level filesystem mapping ──────────────────────────────────────

# DB table name (snake_case) → subdirectory under the domain ts_dir.
# Tables not listed here are assumed to live directly in the domain root
# (checked at runtime by scanning the filesystem).
SUBDIR_KEYWORDS: dict[str, str] = {
    "fundamentals": "fundamentals",
    "operations": "operations",
    "people": "people",
    "employment": "employment",
    "time": "time",
    "selfservice": "selfservice",
}


@dataclass
class TableLocation:
    """Resolved location of a Drizzle table module on disk."""
    pg_schema: str
    pg_table: str
    ts_var: str          # camelCase variable name (e.g. "leaveRequests")
    ts_module: str       # bare module name without extension (e.g. "leaveRequests")
    rel_dir: str         # directory relative to packages/db/src/ (e.g. "schema-hrm/hr/operations")
    domain: DomainConfig


# ── Naming helpers ──────────────────────────────────────────────────────

def pg_to_camel(snake: str) -> str:
    """Convert snake_case PostgreSQL name to camelCase TypeScript name."""
    parts = snake.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def pg_table_to_ts_var(table_name: str) -> str:
    """Convert a PG table name to the Drizzle export variable name (camelCase)."""
    return pg_to_camel(table_name)


def relation_name_for_fk(
    fk_column: str, target_table_var: str, is_self_ref: bool = False
) -> str:
    """
    Derive a human-friendly relation name from an FK column.

    Rules (matching existing AFENDA conventions):
    - tenantId → "tenant"
    - employeeId → "employee"
    - approvedBy / processedBy → strip "By" suffix, use as-is ("approver", "processor")
    - parentDepartmentId → "parent"
    - Self-references that end with "Id" and start with "parent" → "parent" / "children"
    """
    col = fk_column

    if col == "tenantId":
        return "tenant"

    if col.endswith("By"):
        stem = col[:-2]  # "approvedBy" → "approved"
        mapping = {
            "approved": "approver",
            "processed": "processor",
            "assigned": "assigner",
            "reviewed": "reviewer",
            "created": "creator",
            "updated": "updater",
            "resolved": "resolver",
            "conducted": "conductor",
            "evaluated": "evaluator",
            "nominated": "nominator",
            "verified": "verifier",
            "issued": "issuer",
            "witnessed": "witness",
            "changed": "changer",
            "recorded": "recorder",
            "assessed": "assessor",
        }
        return mapping.get(stem, stem)

    if col.startswith("parent") and col.endswith("Id"):
        return "parent"

    # Strip trailing "Id" and use as relation name
    if col.endswith("Id"):
        name = col[:-2]
        # If the name matches the target table var, use it as-is
        # e.g. departmentId → "department"
        return name[0].lower() + name[1:]

    return pg_to_camel(col)


def alias_for_duplicate(
    source_table: str, fk_column: str, target_table: str
) -> str:
    """
    Generate an alias string for duplicate FK targets.
    Follows existing AFENDA pattern: "source_semantic_context"
    e.g. "payroll_run_processor", "leave_request_approver"
    """
    src = _camel_to_snake(source_table)
    col = fk_column

    if col.endswith("By"):
        stem = col[:-2]
        mapping = {
            "approved": "approver",
            "processed": "processor",
            "assigned": "assigner",
            "reviewed": "reviewer",
            "conducted": "conductor",
            "evaluated": "evaluator",
            "nominated": "nominator",
            "verified": "verifier",
            "issued": "issuer",
            "witnessed": "witness",
        }
        suffix = mapping.get(stem, stem)
        return f"{src}_{suffix}"

    if col.startswith("parent"):
        return f"{src}_parent"

    # Generic: source_column (strip Id)
    col_stem = col[:-2] if col.endswith("Id") else col
    return f"{src}_{_camel_to_snake(col_stem)}"


def _camel_to_snake(name: str) -> str:
    """Convert camelCase to snake_case."""
    import re
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()
