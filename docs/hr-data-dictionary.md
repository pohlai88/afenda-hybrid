# HR / HCM data dictionary (P0b)

**Certified scope (first release)**: Configure **one primary country** and **one payroll legal entity** per implementation (e.g. Malaysia + a single `core.legal_entities` row). Expand statutory seeds and `taxRegime` payloads before multi-country production.

## Core payroll identifiers

| Concept | Table | Key columns | Notes |
|--------|--------|-------------|--------|
| Payroll legal entity | `hr.employees` | `payrollLegalEntityId` | Optional; statutory + tax alignment for that employment |
| Pay run scope | `payroll.payroll_periods`, `payroll.payroll_runs` | `legalEntityId` | Nullable; set for entity-scoped filing |
| Statutory catalog | `payroll.statutory_schemes` | `schemeCode`, `country`, `category` | Global reference (no `tenantId`) |
| Statutory rates | `payroll.statutory_scheme_rates` | `effectiveFrom`, `employeeRate`, `employerRate`, `wageCeiling` | Versioned; seed MY examples in migration |
| Enrollment | `payroll.social_insurance_profiles` | `statutorySchemeId`, `legalEntityId`, rates | Prefer `statutorySchemeId`; legacy `schemeName` when needed |
| Pay line trace | `payroll.payroll_entries` | `statutorySchemeId` | Links statutory lines to scheme |
| Tax engine | `payroll.tax_profiles` | `taxJurisdictionCountry`, `taxRegime`, `regimePayload`, `filingStatus` | `filingStatus` applies when `taxRegime = US_FEDERAL`; else use `regimePayload` |
| Pay masters | `payroll.pay_components` | `earningsTypeId`, `deductionTypeId` | At most one set (CHECK); ties to `earnings_types` / `deduction_types` |

## Recruitment & benefits

| Concept | Table | Key columns |
|--------|--------|-------------|
| Structured ask | `recruitment.candidates` | `expectedSalaryAmount`, `expectedSalaryCurrencyId`, `expectedSalaryPeriod`; legacy `expectedSalary` text |
| Coverage | `benefits.benefit_enrollments` | `coverageLevel` → `benefits.benefit_coverage_level` enum |
| Bank routing | `payroll.bank_accounts` | `bankCode`, `branchCode` (+ existing SWIFT/IBAN) |

## Talent (capability, PM, succession, ER)

| Concept | Table | Key columns | Notes |
|---------|--------|-------------|--------|
| Skill master | `talent.skills` | `skillCode`, `category`, `parentSkillId` | Tenant-scoped hierarchy |
| Employee skills | `talent.employee_skills` | `employeeId`, `skillId`, `proficiency` | `proficiency` → `talent.proficiency_level` |
| Cert catalog | `talent.certifications` | `certificationCode`, `issuingOrganization` | Master for HR + L&D |
| Employee credentials | `talent.employee_certifications` | Snapshots + `verifiedBy` / `verificationDate` | See [talent-domain-boundaries.md](./talent-domain-boundaries.md) vs `learning.certification_awards` |
| Competency model | `talent.competency_frameworks`, `talent.competency_skills` | `frameworkCode`, `requiredLevel`, `skillId` | Links to `hr.positions` / `job_roles` via custom SQL |
| Talent pools | `talent.talent_pools`, `talent.talent_pool_memberships` | `poolCode`, `joinedDate`, `status` | Bench / high-potential tagging |
| Goals & tracking | `talent.performance_goals`, `talent.goal_tracking` | `goalType`, `targetDate`, `progressPercent` | `goal_tracking` is append-only, no `tenantId` |
| Reviews | `talent.performance_reviews`, `talent.performance_review_goals` | `reviewPeriodStart/End`, `status`, goal snapshots | CSQL-014 triggers on `finalScore` / review status |
| Promotions | `talent.promotion_records` | `effectiveDate`, `status`, `approvedBy` / `approvedAt` | Optional position/grade FKs via custom SQL |
| Succession | `talent.succession_plans` | `positionId`, `successorId`, `readinessLevel`, `targetDate` | Lifecycle CHECK on live statuses |
| ER cases | `talent.grievance_records`, `talent.disciplinary_actions` | Type/status enums, dates | Medium sensitivity; restrict access |
| Case graph | `talent.case_links` | `sourceType`/`sourceId`, `targetType`/`targetId`, `linkType` | Polymorphic; app-enforced FK — see [talent-domain-boundaries.md](./talent-domain-boundaries.md) |

Full table list: [hr-schema-audit-matrix.md](./hr-schema-audit-matrix.md) · inventory: [talent-schema-inventory.md](./talent-schema-inventory.md).

## Process — mandatory fields (go-live minimum)

1. **Hire**: `hr.persons`, `hr.employees`, `core.locations` or `locationId`, `payrollLegalEntityId` when running payroll.
2. **Payroll**: `payroll.payroll_periods` (+ `legalEntityId` when entity-scoped), `payroll.payroll_runs`, `payroll_entries` / `payslips`; statutory schemes seeded; employee `social_insurance_profiles` where applicable.
3. **Leave**: `hr.leave_types`, balances, `leave_requests`.
4. **Benefits**: `benefits.benefit_plans`, `benefit_enrollments` with `coverageLevel` when relevant.

## PII tiers (summary)

- **High**: `national_identifiers`, `bank_accounts`, `tax_profiles.taxIdNumber`, `person_documents`, `audit_trail` payloads — encrypt at rest, restrict access.
- **Medium**: `persons`, names, contacts, addresses, `candidates` PII.
- **Low**: org structure, job codes, enums.

See [hr-schema-audit-matrix.md](./hr-schema-audit-matrix.md) for full table list.
