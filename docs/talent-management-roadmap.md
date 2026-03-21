# Talent management — schema roadmap (future)

The current `talent` schema covers skills/competencies, pools, performance goals/reviews (with CSQL-014), promotions, succession rows, and ER (grievance/disciplinary) plus `case_links`. Below are common enterprise gaps **not** modeled yet; add only after product prioritization and impact analysis.

| Capability                   | Suggested direction                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Calibration**              | Sessions or committees, normalized rating distributions, audit of changes pre/post calibration.                                              |
| **360 / multi-rater**        | `review_raters` (or similar): `reviewId`, `raterEmployeeId`, `relationship`, `status`, due dates.                                            |
| **IDP**                      | Structured development plans (rows or JSON with validation), linked to goals and/or succession `developmentPlan` text.                       |
| **Nine-box / talent review** | Dimensions (e.g. performance + potential), review cycle id, cell assignment history.                                                         |
| **Internal mobility**        | Links from `recruitment.applications` / requisitions to internal `employeeId`, or dedicated internal posting table.                          |
| **Hire → talent**            | Event on hire (from recruitment onboarding) to seed default skills/reviews — often app workflow, optional FK from checklist to first review. |

Keep cross-schema FKs and circular dependencies aligned with [CUSTOM_SQL_REGISTRY.json](../src/db/schema-platform/audit/CUSTOM_SQL_REGISTRY.json) patterns.
