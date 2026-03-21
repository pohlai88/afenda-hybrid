# Denormalized Snapshot Fields Evaluation

## Overview

This document evaluates which document-style tables should have denormalized snapshot fields
to preserve historical accuracy when source records change.

## Rationale

When a document is created (e.g., a payslip or offer letter), it should preserve the values
that were current at creation time. If the source record changes later (e.g., employee name
change, department restructure), the document should still show the original values.

## Candidate Tables

### 1. payroll.payslips

**Current state:** References `employeeId` via FK

**Recommended snapshot fields:**
- `employeeName` - Full name at time of payslip generation
- `employeeCode` - Employee code at time of generation
- `departmentName` - Department name at time of generation
- `positionTitle` - Position title at time of generation

**Justification:** Payslips are legal documents that must reflect the employee's status
at the time of payment, not their current status.

### 2. recruitment.offer_letters

**Current state:** References `applicationId`, `positionId`

**Recommended snapshot fields:**
- `candidateName` - Full name at time of offer
- `positionTitle` - Position title being offered
- `departmentName` - Department name at time of offer
- `salaryAmount` / `salaryCurrency` - Already captured
- `reportingManagerName` - Manager name at time of offer

**Justification:** Offer letters are contractual documents. The position title and
department may change after the offer is made.

### 3. hr.employment_contracts

**Current state:** References `employeeId`

**Recommended snapshot fields:**
- `employeeName` - Full name at contract signing
- `positionTitle` - Position title in contract
- `departmentName` - Department at contract signing
- `managerName` - Reporting manager at contract signing

**Justification:** Employment contracts are legal documents that define the terms
at the time of agreement.

### 4. payroll.final_settlements

**Current state:** References `employeeId`

**Recommended snapshot fields:**
- `employeeName` - Full name at settlement
- `employeeCode` - Code at settlement
- `departmentName` - Last department
- `positionTitle` - Last position
- `terminationDate` - Already captured

**Justification:** Final settlements are legal documents for terminated employees
who may no longer have active records.

## Tables That Don't Need Snapshots

- **Leave requests** - Operational data, current employee info is appropriate
- **Attendance logs** - Operational data
- **Timesheets** - Operational data, linked to payroll run which has snapshots
- **Performance reviews** - Should show current employee info for active reviews

## Implementation Approach

1. Add nullable snapshot columns to candidate tables
2. Populate on INSERT via application layer (not triggers, to keep DB simple)
3. Never update snapshot columns after creation
4. Use snapshot columns for display, FK columns for joins/queries

## Migration Strategy

For existing data:
1. Add columns as nullable
2. Backfill from current employee/position/department data
3. Note in migration that backfilled data reflects current state, not historical

## Decision

**Recommendation:** Implement snapshot fields for payslips and offer_letters first,
as these are the most legally sensitive documents. Employment contracts and final
settlements can follow in a subsequent phase.

**Status:** Pending product team review before implementation.
