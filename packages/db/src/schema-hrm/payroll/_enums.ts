/**
 * Payroll Domain Enums Barrel
 *
 * Re-exports all enums from the Payroll schema for easier discovery.
 */

export {
  payrollRunStatuses,
  payrollRunStatusEnum,
  PayrollRunStatusSchema,
  type PayrollRunStatus,
} from "./operations/payrollRuns";

export {
  payslipStatuses,
  payslipStatusEnum,
  PayslipStatusSchema,
  type PayslipStatus,
} from "./operations/payslips";

export {
  taxSlabStatuses,
  taxSlabStatusEnum,
  TaxSlabStatusSchema,
  type TaxSlabStatus,
} from "./fundamentals/incomeTaxSlabs";

export {
  taxExemptionCategoryStatuses,
  taxExemptionCategoryStatusEnum,
  TaxExemptionCategoryStatusSchema,
  type TaxExemptionCategoryStatus,
} from "./fundamentals/taxExemptionCategories";

export {
  taxDeclarationStatuses,
  taxDeclarationStatusEnum,
  TaxDeclarationStatusSchema,
  type TaxDeclarationStatus,
} from "./operations/taxExemptionDeclarations";

export {
  payFrequencies,
  payFrequencyEnum,
  PayFrequencySchema,
  type PayFrequency,
} from "./fundamentals/compensationPackages";

export {
  salaryStructureStatuses,
  salaryStructureStatusEnum,
  SalaryStructureStatusSchema,
  type SalaryStructureStatus,
} from "./fundamentals/salaryStructures";

export {
  payrollCorrectionStatuses,
  payrollCorrectionStatusEnum,
  PayrollCorrectionStatusSchema,
  type PayrollCorrectionStatus,
} from "./operations/payrollCorrections";

export {
  retentionBonusStatuses,
  retentionBonusStatusEnum,
  RetentionBonusStatusSchema,
  type RetentionBonusStatus,
} from "./operations/retentionBonuses";

export {
  salaryWithholdingStatuses,
  salaryWithholdingStatusEnum,
  SalaryWithholdingStatusSchema,
  type SalaryWithholdingStatus,
} from "./operations/salaryWithholdings";

export {
  gratuityRuleStatuses,
  gratuityRuleStatusEnum,
  GratuityRuleStatusSchema,
  type GratuityRuleStatus,
} from "./fundamentals/gratuityRules";

export {
  gratuitySettlementStatuses,
  gratuitySettlementStatusEnum,
  GratuitySettlementStatusSchema,
  type GratuitySettlementStatus,
} from "./operations/gratuitySettlements";
