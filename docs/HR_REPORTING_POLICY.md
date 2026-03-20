# Manager vs reporting lines (source of truth)

## Data model

- **`hr.employees.managerId`**: single “primary direct manager” pointer, convenient for org charts and quick lookups.
- **`hr.reporting_lines`**: effective-dated rows with `reportType` (`DIRECT`, `DOTTED`, `FUNCTIONAL`, `ADMINISTRATIVE`).

## Policy (recommended)

1. **Authoritative history** for audits and matrix organizations: **`reporting_lines`** (especially for non-`DIRECT` relationships).
2. **Cached primary direct manager**: keep **`employees.managerId`** in sync with the active `DIRECT` open-ended row (`effectiveTo IS NULL`) for each employee, via application job or DB trigger.
3. On conflict, **prefer `reporting_lines`** for compliance narratives; reconcile `managerId` immediately.

Document exceptions (e.g. contractors without HRIS access) in tenant runbooks.
