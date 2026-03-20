# HR / HCM schema audit matrix (112 tables)

**Purpose**: One row per application table under `src/db/schema` (excluding `_shared` doc examples), including **statutorySchemes** and **statutorySchemeRates** from the HR upgrade. Use for sign-off and `scripts/verify-hr-schema-audit-matrix.ts`.

**Rubric keys** (per [plan](.cursor/plans)): **P** = Pass, **A** = Partial, **F** = Fail, **N** = N/A.

| # | Schema | Table | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | P9 | P10 | ISO30414 | Privacy | Payroll | Notes |
|---|--------|-------|----|----|----|----|----|----|----|----|----|-----|----------|---------|---------|-------|
| 1 | audit | auditTrail | P | N | P | N | P | N | P | P | P | N | N | P | N | Immutable event log |
| 2 | audit | retentionPolicies | P | N | P | P | P | N | P | P | P | N | N | P | N | Retention governance |
| 3 | audit | retentionExecutions | P | N | P | P | P | N | P | P | P | N | N | P | N | Execution audit |
| 4 | benefits | benefitPlans | P | P | P | N | P | N | P | P | P | N | P | P | N | Plan master |
| 5 | benefits | benefitsProviders | P | P | P | N | P | N | P | P | P | N | N | P | N | Vendor master |
| 6 | benefits | benefitEnrollments | P | P | P | P | P | N | A | P | P | N | P | P | N | coverageLevel now enum-backed |
| 7 | benefits | dependentCoverages | P | P | P | N | P | N | P | P | P | N | P | P | N | Dependent link |
| 8 | benefits | claimsRecords | P | P | P | N | P | N | P | P | P | N | P | P | N | Claims |
| 9 | core | tenants | P | N | P | N | P | N | P | P | P | N | P | P | N | Root tenancy |
| 10 | core | organizations | P | P | P | P | P | P | P | P | P | N | P | P | N | Org hierarchy |
| 11 | core | legalEntities | P | P | P | N | P | P | P | P | P | N | P | P | P | Statutory anchor |
| 12 | core | locations | P | P | P | N | P | P | P | P | P | N | P | P | N | Work sites |
| 13 | core | regions | P | N | P | N | N | P | P | P | P | N | P | N | N | Global ref |
| 14 | core | currencies | P | N | P | N | N | N | P | P | P | N | P | N | P | FX |
| 15 | core | costCenters | P | P | P | N | P | P | P | P | P | N | P | P | N | Cost allocation |
| 16 | hr | persons | P | P | P | P | P | P | P | P | P | N | P | P | N | Data subject |
| 17 | hr | personNames | P | P | P | P | P | N | P | P | P | N | P | P | N | Legal name variants |
| 18 | hr | contactMethods | P | P | P | N | P | N | P | P | P | N | P | P | N | PII |
| 19 | hr | addresses | P | P | P | N | P | N | P | P | P | N | P | P | N | PII |
| 20 | hr | nationalIdentifiers | P | P | P | N | P | P | P | P | P | N | N | P | P | Encrypt at rest |
| 21 | hr | emergencyContacts | P | P | P | N | P | N | P | P | P | N | N | P | N | PII |
| 22 | hr | dependents | P | P | P | N | P | N | P | P | P | N | P | P | N | Benefits link |
| 23 | hr | personDocuments | P | P | P | N | P | N | P | P | P | N | N | P | N | Document store ref |
| 24 | hr | employees | P | P | A | P | P | P | P | P | P | A | P | P | P | payrollLegalEntityId added |
| 25 | hr | departments | P | P | P | P | P | P | P | P | P | N | P | P | N | Org + LE + CC |
| 26 | hr | positions | P | P | P | N | P | N | P | P | P | N | P | P | N | Headcount / FTE |
| 27 | hr | jobFamilies | P | P | P | N | P | N | P | P | P | N | P | P | N | Job structure |
| 28 | hr | jobRoles | P | P | P | N | P | N | P | P | P | N | P | P | N | Job structure |
| 29 | hr | jobGrades | P | P | P | N | P | N | P | P | P | N | P | P | P | Pay spine |
| 30 | hr | employmentContracts | P | P | P | P | P | P | P | P | P | N | P | P | N | Contract terms |
| 31 | hr | employmentStatusHistory | P | P | P | P | P | N | P | P | P | N | P | P | N | Status history |
| 32 | hr | probationRecords | P | P | P | P | P | N | P | P | P | N | P | P | N | Probation |
| 33 | hr | noticePeriodRecords | P | P | P | P | P | N | P | P | P | N | P | P | N | Notice |
| 34 | hr | reportingLines | P | P | P | P | P | N | P | P | P | A | P | P | N | Matrix mgr; see HR_REPORTING_POLICY |
| 35 | hr | employeeTransfers | P | P | P | P | P | N | P | P | P | N | P | P | N | Mobility |
| 36 | hr | secondments | P | P | P | P | P | N | P | P | P | N | P | P | N | Temp assignment |
| 37 | hr | positionAssignments | P | P | P | P | P | N | P | P | P | N | P | P | N | Slot assignment |
| 38 | hr | leaveTypes | P | P | P | N | P | N | P | P | P | N | P | P | N | Leave master |
| 39 | hr | leaveBalances | P | P | P | P | P | N | P | P | P | N | P | P | N | Balances |
| 40 | hr | leaveRequests | P | P | P | P | P | N | P | P | P | N | P | P | N | Workflow |
| 41 | hr | workSchedules | P | P | P | N | P | N | P | P | P | N | P | P | N | Scheduling |
| 42 | hr | shiftAssignments | P | P | P | P | P | N | P | P | P | N | P | P | N | Shifts |
| 43 | hr | shiftSwaps | P | P | P | P | P | N | P | P | P | N | N | P | N | Swaps |
| 44 | hr | timesheets | P | P | P | P | P | N | P | P | P | N | P | P | P | Time to pay |
| 45 | hr | absenceRecords | P | P | P | P | P | N | P | P | P | N | P | P | N | Absence |
| 46 | hr | overtimeRecords | P | P | P | P | P | N | P | P | P | N | P | P | P | OT pay |
| 47 | hr | holidayCalendars | P | P | P | N | P | N | P | P | P | N | P | P | N | Calendar |
| 48 | hr | holidayCalendarEntries | P | P | P | P | P | N | P | P | P | N | P | P | N | Calendar days |
| 49 | hr | attendanceLogs | P | P | P | P | P | N | P | P | P | N | P | P | P | Time clock |
| 50 | hr | documentRequests | P | P | P | P | P | N | P | P | P | N | N | P | N | HRSS |
| 51 | hr | employeeDeclarations | P | P | P | P | P | N | P | P | P | N | N | P | N | Tax proofs |
| 52 | hr | serviceRequests | P | P | P | P | P | N | P | P | P | N | N | P | N | HRSS |
| 53 | hr | assetAssignments | P | P | P | P | P | N | P | P | P | N | N | P | N | Assets |
| 54 | learning | learningPaths | P | P | P | N | P | N | P | P | P | N | P | P | N | L&D |
| 55 | learning | learningPathCourses | P | P | P | P | P | N | P | P | P | N | P | P | N | Path composition |
| 56 | learning | courses | P | P | P | N | P | N | P | P | P | N | P | P | N | Course cat |
| 57 | learning | courseModules | P | P | P | P | P | N | P | P | P | N | P | P | N | Modules |
| 58 | learning | trainers | P | P | P | N | P | N | P | P | P | N | P | P | N | Trainers |
| 59 | learning | trainingSessions | P | P | P | P | P | N | P | P | P | N | P | P | N | Sessions |
| 60 | learning | trainingEnrollments | P | P | P | P | P | N | P | P | P | N | P | P | N | Enroll |
| 61 | learning | assessments | P | P | P | P | P | N | P | P | P | N | P | P | N | Tests |
| 62 | learning | trainingFeedback | P | P | P | P | P | N | P | P | P | N | P | P | N | Feedback |
| 63 | learning | trainingCostRecords | P | P | P | P | P | N | P | P | P | N | P | P | N | Cost |
| 64 | learning | certificationAwards | P | P | P | P | P | N | P | P | P | N | P | P | N | Awards |
| 65 | payroll | payComponents | P | P | P | N | P | P | P | P | P | A | P | P | P | FK to earn/ded types |
| 66 | payroll | earningsTypes | P | P | P | N | P | P | P | P | P | A | P | P | P | Pay master |
| 67 | payroll | deductionTypes | P | P | P | N | P | P | P | P | P | A | P | P | P | Pay master |
| 68 | payroll | expenseTypes | P | P | P | N | P | P | P | P | P | N | P | P | N | Expense cat |
| 69 | payroll | payGradeStructures | P | P | P | P | P | P | P | P | P | N | P | P | P | Grade pay |
| 70 | payroll | compensationPackages | P | P | P | P | P | P | P | P | P | N | P | P | P | Base pay |
| 71 | payroll | taxProfiles | P | P | P | P | P | P | A | P | P | N | P | P | P | taxRegime + payload |
| 72 | payroll | socialInsuranceProfiles | P | P | P | P | P | P | A | P | P | A | P | P | P | statutorySchemeId + LE |
| 73 | payroll | statutorySchemes | P | N | P | N | P | P | P | P | P | N | P | P | P | **New** catalog |
| 74 | payroll | statutorySchemeRates | P | N | P | P | P | P | P | P | P | N | P | P | P | **New** versioned rates |
| 75 | payroll | bankAccounts | P | P | P | N | P | P | P | P | P | N | P | P | P | bankCode/branchCode |
| 76 | payroll | payrollPeriods | P | P | P | P | P | P | P | P | P | N | P | P | P | legalEntityId |
| 77 | payroll | payrollRuns | P | P | P | P | P | P | P | P | P | N | P | P | P | legalEntityId |
| 78 | payroll | payrollEntries | P | P | P | N | P | P | P | P | P | N | P | P | P | statutorySchemeId FK |
| 79 | payroll | payslips | P | P | P | P | P | P | P | P | P | N | P | P | P | Statements |
| 80 | payroll | paymentRecords | P | P | P | P | P | P | P | P | P | N | P | P | P | Disbursement |
| 81 | payroll | loanRecords | P | P | P | P | P | N | P | P | P | N | P | P | N | Loans |
| 82 | payroll | expenseClaims | P | P | P | P | P | N | P | P | P | N | P | P | N | Claims |
| 83 | payroll | finalSettlements | P | P | P | P | P | P | P | P | P | N | P | P | P | Termination pay |
| 84 | recruitment | candidates | P | P | P | N | P | N | A | P | P | N | P | P | N | Structured salary exp. |
| 85 | recruitment | applications | P | P | P | P | P | N | P | P | P | N | P | P | N | ATS |
| 86 | recruitment | jobRequisitions | P | P | P | P | P | P | P | P | P | N | P | P | N | Reqs |
| 87 | recruitment | interviews | P | P | P | P | P | N | P | P | P | N | P | P | N | Pipeline |
| 88 | recruitment | offerLetters | P | P | P | P | P | N | P | P | P | N | P | P | N | Offers |
| 89 | recruitment | backgroundChecks | P | P | P | P | P | N | P | P | P | N | N | P | N | Screening |
| 90 | recruitment | onboardingChecklists | P | P | P | P | P | N | P | P | P | N | P | P | N | Onboarding |
| 91 | recruitment | probationEvaluations | P | P | P | P | P | N | P | P | P | N | P | P | N | Eval |
| 92 | security | users | P | P | P | N | P | N | P | P | P | N | N | P | N | Access |
| 93 | security | roles | P | P | P | N | P | N | P | P | P | N | N | P | N | RBAC |
| 94 | security | userRoles | P | P | P | P | P | N | P | P | P | N | N | P | N | Assignment |
| 95 | security | servicePrincipals | P | P | P | N | P | N | P | P | P | N | N | P | N | Automation |
| 96 | talent | talentPools | P | P | P | N | P | N | P | P | P | N | P | P | N | Succession pools |
| 97 | talent | skills | P | P | P | N | P | N | P | P | P | N | P | P | N | Skills cat |
| 98 | talent | certifications | P | P | P | N | P | N | P | P | P | N | P | P | N | Certs |
| 99 | talent | competencyFrameworks | P | P | P | N | P | N | P | P | P | N | P | P | N | Framework |
| 100 | talent | competencySkills | P | P | P | P | P | N | P | P | P | N | P | P | N | Matrix |
| 101 | talent | employeeSkills | P | P | P | P | P | N | P | P | P | N | P | P | N | Skill inventory |
| 102 | talent | successionPlans | P | P | P | P | P | N | P | P | P | N | P | P | N | Succession |
| 103 | talent | performanceGoals | P | P | P | P | P | N | P | P | P | N | P | P | N | PM |
| 104 | talent | goalTracking | P | P | P | P | P | N | P | P | P | N | P | P | N | PM |
| 105 | talent | performanceReviews | P | P | P | P | P | N | P | P | P | N | P | P | N | PM |
| 106 | talent | promotionRecords | P | P | P | P | P | N | P | P | P | N | P | P | N | Promotions |
| 107 | talent | grievanceRecords | P | P | P | P | P | N | P | P | P | N | N | P | N | ER |
| 108 | talent | disciplinaryActions | P | P | P | P | P | N | P | P | P | N | N | P | N | ER |
| 109 | talent | employeeCertifications | P | P | P | P | P | N | P | P | P | N | P | P | N | Credential holdings + verification |
| 110 | talent | talentPoolMemberships | P | P | P | P | P | N | P | P | P | N | P | P | N | Pool roster |
| 111 | talent | performanceReviewGoals | P | P | P | P | P | N | P | P | P | N | P | P | N | Review–goal snapshots; CSQL-014 |
| 112 | talent | caseLinks | P | P | P | N | P | N | P | P | P | N | N | P | N | Grievance/discipline graph |

**Column legend**: P1 Purpose/grain · P2 Tenancy · P3 Referential integrity · P4 Effective dating · P5 PII/sensitivity · P6 Jurisdiction · P7 Master data · P8 Process map · P9 Auditability · P10 Overlap risk.

**Reviewer / sign-off**: _Owner name · Date · Commit SHA_
</think>
Fixing the matrix row count: 106 existing + 2 new = 108 rows. Verifying numbering and removing the footer note.

<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
StrReplace