import { defineRelations } from "drizzle-orm";
import { bankAccounts } from "./fundamentals/bankAccounts";
import { compensationPackages } from "./fundamentals/compensationPackages";
import { deductionTypes } from "./fundamentals/deductionTypes";
import { earningsTypes } from "./fundamentals/earningsTypes";
import { expenseTypes } from "./fundamentals/expenseTypes";
import { gratuityRuleSlabs } from "./fundamentals/gratuityRuleSlabs";
import { gratuityRules } from "./fundamentals/gratuityRules";
import { incomeTaxSlabEntries } from "./fundamentals/incomeTaxSlabEntries";
import { incomeTaxSlabs } from "./fundamentals/incomeTaxSlabs";
import { payComponents } from "./fundamentals/payComponents";
import { payGradeStructures } from "./fundamentals/payGradeStructures";
import { salaryStructureDetails } from "./fundamentals/salaryStructureDetails";
import { salaryStructures } from "./fundamentals/salaryStructures";
import { socialInsuranceProfiles } from "./fundamentals/socialInsuranceProfiles";
import { statutorySchemeRates } from "./fundamentals/statutorySchemeRates";
import { statutorySchemes } from "./fundamentals/statutorySchemes";
import { taxExemptionCategories } from "./fundamentals/taxExemptionCategories";
import { taxProfiles } from "./fundamentals/taxProfiles";
import { arrearEntries } from "./operations/arrearEntries";
import { expenseClaims } from "./operations/expenseClaims";
import { finalSettlements } from "./operations/finalSettlements";
import { gratuitySettlements } from "./operations/gratuitySettlements";
import { loanRecords } from "./operations/loanRecords";
import { paymentRecords } from "./operations/paymentRecords";
import { payrollCorrectionEntries } from "./operations/payrollCorrectionEntries";
import { payrollCorrections } from "./operations/payrollCorrections";
import { payrollEntries } from "./operations/payrollEntries";
import { payrollPeriods } from "./operations/payrollPeriods";
import { payrollRuns } from "./operations/payrollRuns";
import { payslips } from "./operations/payslips";
import { retentionBonuses } from "./operations/retentionBonuses";
import { salaryStructureAssignments } from "./operations/salaryStructureAssignments";
import { salaryWithholdings } from "./operations/salaryWithholdings";
import { taxExemptionDeclarationEntries } from "./operations/taxExemptionDeclarationEntries";
import { taxExemptionDeclarations } from "./operations/taxExemptionDeclarations";
import { currencies } from "../../schema-platform/core/currencies";
import { legalEntities } from "../../schema-platform/core/legalEntities";
import { tenants } from "../../schema-platform/core/tenants";
import { jobGrades } from "../hr/employment/jobGrades";
import { employees } from "../hr/fundamentals/employees";

export const payrollRelations = defineRelations(
  {
    arrearEntries,
    bankAccounts,
    compensationPackages,
    deductionTypes,
    earningsTypes,
    expenseClaims,
    expenseTypes,
    finalSettlements,
    gratuityRuleSlabs,
    gratuityRules,
    gratuitySettlements,
    incomeTaxSlabEntries,
    incomeTaxSlabs,
    loanRecords,
    payComponents,
    payGradeStructures,
    paymentRecords,
    payrollCorrectionEntries,
    payrollCorrections,
    payrollEntries,
    payrollPeriods,
    payrollRuns,
    payslips,
    retentionBonuses,
    salaryStructureAssignments,
    salaryStructureDetails,
    salaryStructures,
    salaryWithholdings,
    socialInsuranceProfiles,
    statutorySchemeRates,
    statutorySchemes,
    taxExemptionCategories,
    taxExemptionDeclarationEntries,
    taxExemptionDeclarations,
    taxProfiles,
    currencies,
    employees,
    jobGrades,
    legalEntities,
    tenants,
  },
  (r) => ({
    arrearEntries: {
      employee: r.one.employees({
        from: r.arrearEntries.employeeId,
        to: r.employees.employeeId,
      }),
      forPeriod: r.one.payrollPeriods({
        from: r.arrearEntries.forPeriodId,
        to: r.payrollPeriods.payrollPeriodId,
      }),
      payComponent: r.one.payComponents({
        from: r.arrearEntries.payComponentId,
        to: r.payComponents.payComponentId,
      }),
      payrollRun: r.one.payrollRuns({
        from: r.arrearEntries.payrollRunId,
        to: r.payrollRuns.payrollRunId,
      }),
    },

    bankAccounts: {
      tenant: r.one.tenants({
        from: r.bankAccounts.tenantId,
        to: r.tenants.tenantId,
      }),
      currency: r.one.currencies({
        from: r.bankAccounts.currencyId,
        to: r.currencies.currencyId,
        optional: true,
      }),
      employee: r.one.employees({
        from: r.bankAccounts.employeeId,
        to: r.employees.employeeId,
      }),
      paymentRecords: r.many.paymentRecords({
        from: r.bankAccounts.bankAccountId,
        to: r.paymentRecords.bankAccountId,
      }),
    },

    compensationPackages: {
      tenant: r.one.tenants({
        from: r.compensationPackages.tenantId,
        to: r.tenants.tenantId,
      }),
      currency: r.one.currencies({
        from: r.compensationPackages.currencyId,
        to: r.currencies.currencyId,
      }),
      employee: r.one.employees({
        from: r.compensationPackages.employeeId,
        to: r.employees.employeeId,
      }),
    },

    deductionTypes: {
      tenant: r.one.tenants({
        from: r.deductionTypes.tenantId,
        to: r.tenants.tenantId,
      }),
      payComponents: r.many.payComponents({
        from: r.deductionTypes.deductionTypeId,
        to: r.payComponents.deductionTypeId,
      }),
    },

    earningsTypes: {
      tenant: r.one.tenants({
        from: r.earningsTypes.tenantId,
        to: r.tenants.tenantId,
      }),
      payComponents: r.many.payComponents({
        from: r.earningsTypes.earningsTypeId,
        to: r.payComponents.earningsTypeId,
      }),
    },

    expenseClaims: {
      tenant: r.one.tenants({
        from: r.expenseClaims.tenantId,
        to: r.tenants.tenantId,
      }),
      approver: r.one.employees({
        from: r.expenseClaims.approvedBy,
        to: r.employees.employeeId,
        optional: true,
      }),
      currency: r.one.currencies({
        from: r.expenseClaims.currencyId,
        to: r.currencies.currencyId,
      }),
      employee: r.one.employees({
        from: r.expenseClaims.employeeId,
        to: r.employees.employeeId,
        alias: "expense_claims_employee",
      }),
      expenseType: r.one.expenseTypes({
        from: r.expenseClaims.expenseTypeId,
        to: r.expenseTypes.expenseTypeId,
      }),
    },

    expenseTypes: {
      tenant: r.one.tenants({
        from: r.expenseTypes.tenantId,
        to: r.tenants.tenantId,
      }),
      expenseClaims: r.many.expenseClaims({
        from: r.expenseTypes.expenseTypeId,
        to: r.expenseClaims.expenseTypeId,
      }),
    },

    finalSettlements: {
      tenant: r.one.tenants({
        from: r.finalSettlements.tenantId,
        to: r.tenants.tenantId,
      }),
      approver: r.one.employees({
        from: r.finalSettlements.approvedBy,
        to: r.employees.employeeId,
        optional: true,
      }),
      currency: r.one.currencies({
        from: r.finalSettlements.currencyId,
        to: r.currencies.currencyId,
      }),
      employee: r.one.employees({
        from: r.finalSettlements.employeeId,
        to: r.employees.employeeId,
        alias: "final_settlements_employee",
      }),
      processor: r.one.employees({
        from: r.finalSettlements.processedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "final_settlements_processor",
      }),
    },

    gratuityRuleSlabs: {
      rule: r.one.gratuityRules({
        from: r.gratuityRuleSlabs.ruleId,
        to: r.gratuityRules.ruleId,
      }),
    },

    gratuityRules: {
      tenant: r.one.tenants({
        from: r.gratuityRules.tenantId,
        to: r.tenants.tenantId,
      }),
      gratuityRuleSlabs: r.many.gratuityRuleSlabs({
        from: r.gratuityRules.ruleId,
        to: r.gratuityRuleSlabs.ruleId,
      }),
      gratuitySettlements: r.many.gratuitySettlements({
        from: r.gratuityRules.ruleId,
        to: r.gratuitySettlements.gratuityRuleId,
      }),
    },

    gratuitySettlements: {
      tenant: r.one.tenants({
        from: r.gratuitySettlements.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.gratuitySettlements.employeeId,
        to: r.employees.employeeId,
      }),
      gratuityRule: r.one.gratuityRules({
        from: r.gratuitySettlements.gratuityRuleId,
        to: r.gratuityRules.ruleId,
      }),
    },

    incomeTaxSlabEntries: {
      taxSlab: r.one.incomeTaxSlabs({
        from: r.incomeTaxSlabEntries.taxSlabId,
        to: r.incomeTaxSlabs.taxSlabId,
      }),
    },

    incomeTaxSlabs: {
      tenant: r.one.tenants({
        from: r.incomeTaxSlabs.tenantId,
        to: r.tenants.tenantId,
      }),
      currency: r.one.currencies({
        from: r.incomeTaxSlabs.currencyId,
        to: r.currencies.currencyId,
      }),
      incomeTaxSlabEntries: r.many.incomeTaxSlabEntries({
        from: r.incomeTaxSlabs.taxSlabId,
        to: r.incomeTaxSlabEntries.taxSlabId,
      }),
    },

    loanRecords: {
      tenant: r.one.tenants({
        from: r.loanRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      approver: r.one.employees({
        from: r.loanRecords.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "loan_records_approver",
      }),
      currency: r.one.currencies({
        from: r.loanRecords.currencyId,
        to: r.currencies.currencyId,
      }),
      employee: r.one.employees({
        from: r.loanRecords.employeeId,
        to: r.employees.employeeId,
      }),
    },

    payComponents: {
      tenant: r.one.tenants({
        from: r.payComponents.tenantId,
        to: r.tenants.tenantId,
      }),
      deductionType: r.one.deductionTypes({
        from: r.payComponents.deductionTypeId,
        to: r.deductionTypes.deductionTypeId,
        optional: true,
      }),
      earningsType: r.one.earningsTypes({
        from: r.payComponents.earningsTypeId,
        to: r.earningsTypes.earningsTypeId,
        optional: true,
      }),
      arrearEntries: r.many.arrearEntries({
        from: r.payComponents.payComponentId,
        to: r.arrearEntries.payComponentId,
      }),
      payrollCorrectionEntries: r.many.payrollCorrectionEntries({
        from: r.payComponents.payComponentId,
        to: r.payrollCorrectionEntries.payComponentId,
      }),
      payrollEntries: r.many.payrollEntries({
        from: r.payComponents.payComponentId,
        to: r.payrollEntries.payComponentId,
      }),
      salaryStructureDetails: r.many.salaryStructureDetails({
        from: r.payComponents.payComponentId,
        to: r.salaryStructureDetails.payComponentId,
      }),
    },

    payGradeStructures: {
      tenant: r.one.tenants({
        from: r.payGradeStructures.tenantId,
        to: r.tenants.tenantId,
      }),
      currency: r.one.currencies({
        from: r.payGradeStructures.currencyId,
        to: r.currencies.currencyId,
      }),
      jobGrade: r.one.jobGrades({
        from: r.payGradeStructures.jobGradeId,
        to: r.jobGrades.jobGradeId,
      }),
    },

    paymentRecords: {
      tenant: r.one.tenants({
        from: r.paymentRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      bankAccount: r.one.bankAccounts({
        from: r.paymentRecords.bankAccountId,
        to: r.bankAccounts.bankAccountId,
        optional: true,
      }),
      currency: r.one.currencies({
        from: r.paymentRecords.currencyId,
        to: r.currencies.currencyId,
      }),
      payslip: r.one.payslips({
        from: r.paymentRecords.payslipId,
        to: r.payslips.payslipId,
      }),
    },

    payrollCorrectionEntries: {
      correction: r.one.payrollCorrections({
        from: r.payrollCorrectionEntries.correctionId,
        to: r.payrollCorrections.correctionId,
      }),
      payComponent: r.one.payComponents({
        from: r.payrollCorrectionEntries.payComponentId,
        to: r.payComponents.payComponentId,
      }),
    },

    payrollCorrections: {
      tenant: r.one.tenants({
        from: r.payrollCorrections.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.payrollCorrections.employeeId,
        to: r.employees.employeeId,
      }),
      payrollRun: r.one.payrollRuns({
        from: r.payrollCorrections.payrollRunId,
        to: r.payrollRuns.payrollRunId,
      }),
      payrollCorrectionEntries: r.many.payrollCorrectionEntries({
        from: r.payrollCorrections.correctionId,
        to: r.payrollCorrectionEntries.correctionId,
      }),
    },

    payrollEntries: {
      tenant: r.one.tenants({
        from: r.payrollEntries.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.payrollEntries.employeeId,
        to: r.employees.employeeId,
      }),
      payComponent: r.one.payComponents({
        from: r.payrollEntries.payComponentId,
        to: r.payComponents.payComponentId,
        optional: true,
      }),
      payrollRun: r.one.payrollRuns({
        from: r.payrollEntries.payrollRunId,
        to: r.payrollRuns.payrollRunId,
      }),
      statutoryScheme: r.one.statutorySchemes({
        from: r.payrollEntries.statutorySchemeId,
        to: r.statutorySchemes.statutorySchemeId,
        optional: true,
      }),
    },

    payrollPeriods: {
      tenant: r.one.tenants({
        from: r.payrollPeriods.tenantId,
        to: r.tenants.tenantId,
      }),
      legalEntity: r.one.legalEntities({
        from: r.payrollPeriods.legalEntityId,
        to: r.legalEntities.legalEntityId,
        optional: true,
      }),
      arrearEntries: r.many.arrearEntries({
        from: r.payrollPeriods.payrollPeriodId,
        to: r.arrearEntries.forPeriodId,
      }),
      payrollRuns: r.many.payrollRuns({
        from: r.payrollPeriods.payrollPeriodId,
        to: r.payrollRuns.payrollPeriodId,
      }),
      taxExemptionDeclarations: r.many.taxExemptionDeclarations({
        from: r.payrollPeriods.payrollPeriodId,
        to: r.taxExemptionDeclarations.payrollPeriodId,
      }),
    },

    payrollRuns: {
      tenant: r.one.tenants({
        from: r.payrollRuns.tenantId,
        to: r.tenants.tenantId,
      }),
      approver: r.one.employees({
        from: r.payrollRuns.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "payroll_runs_approver",
      }),
      currency: r.one.currencies({
        from: r.payrollRuns.currencyId,
        to: r.currencies.currencyId,
      }),
      legalEntity: r.one.legalEntities({
        from: r.payrollRuns.legalEntityId,
        to: r.legalEntities.legalEntityId,
        optional: true,
      }),
      payrollPeriod: r.one.payrollPeriods({
        from: r.payrollRuns.payrollPeriodId,
        to: r.payrollPeriods.payrollPeriodId,
      }),
      processor: r.one.employees({
        from: r.payrollRuns.processedBy,
        to: r.employees.employeeId,
        optional: true,
      }),
      arrearEntries: r.many.arrearEntries({
        from: r.payrollRuns.payrollRunId,
        to: r.arrearEntries.payrollRunId,
      }),
      payrollCorrections: r.many.payrollCorrections({
        from: r.payrollRuns.payrollRunId,
        to: r.payrollCorrections.payrollRunId,
      }),
      payrollEntries: r.many.payrollEntries({
        from: r.payrollRuns.payrollRunId,
        to: r.payrollEntries.payrollRunId,
      }),
      payslips: r.many.payslips({
        from: r.payrollRuns.payrollRunId,
        to: r.payslips.payrollRunId,
      }),
    },

    payslips: {
      tenant: r.one.tenants({
        from: r.payslips.tenantId,
        to: r.tenants.tenantId,
      }),
      currency: r.one.currencies({
        from: r.payslips.currencyId,
        to: r.currencies.currencyId,
      }),
      employee: r.one.employees({
        from: r.payslips.employeeId,
        to: r.employees.employeeId,
      }),
      payrollRun: r.one.payrollRuns({
        from: r.payslips.payrollRunId,
        to: r.payrollRuns.payrollRunId,
      }),
      paymentRecords: r.many.paymentRecords({
        from: r.payslips.payslipId,
        to: r.paymentRecords.payslipId,
      }),
    },

    retentionBonuses: {
      tenant: r.one.tenants({
        from: r.retentionBonuses.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.retentionBonuses.employeeId,
        to: r.employees.employeeId,
      }),
    },

    salaryStructureAssignments: {
      tenant: r.one.tenants({
        from: r.salaryStructureAssignments.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.salaryStructureAssignments.employeeId,
        to: r.employees.employeeId,
      }),
      structure: r.one.salaryStructures({
        from: r.salaryStructureAssignments.structureId,
        to: r.salaryStructures.structureId,
      }),
    },

    salaryStructureDetails: {
      payComponent: r.one.payComponents({
        from: r.salaryStructureDetails.payComponentId,
        to: r.payComponents.payComponentId,
      }),
      structure: r.one.salaryStructures({
        from: r.salaryStructureDetails.structureId,
        to: r.salaryStructures.structureId,
      }),
    },

    salaryStructures: {
      tenant: r.one.tenants({
        from: r.salaryStructures.tenantId,
        to: r.tenants.tenantId,
      }),
      salaryStructureAssignments: r.many.salaryStructureAssignments({
        from: r.salaryStructures.structureId,
        to: r.salaryStructureAssignments.structureId,
      }),
      salaryStructureDetails: r.many.salaryStructureDetails({
        from: r.salaryStructures.structureId,
        to: r.salaryStructureDetails.structureId,
      }),
    },

    salaryWithholdings: {
      tenant: r.one.tenants({
        from: r.salaryWithholdings.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.salaryWithholdings.employeeId,
        to: r.employees.employeeId,
      }),
    },

    socialInsuranceProfiles: {
      tenant: r.one.tenants({
        from: r.socialInsuranceProfiles.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.socialInsuranceProfiles.employeeId,
        to: r.employees.employeeId,
      }),
      legalEntity: r.one.legalEntities({
        from: r.socialInsuranceProfiles.legalEntityId,
        to: r.legalEntities.legalEntityId,
        optional: true,
      }),
      statutoryScheme: r.one.statutorySchemes({
        from: r.socialInsuranceProfiles.statutorySchemeId,
        to: r.statutorySchemes.statutorySchemeId,
        optional: true,
      }),
    },

    statutorySchemeRates: {
      statutoryScheme: r.one.statutorySchemes({
        from: r.statutorySchemeRates.statutorySchemeId,
        to: r.statutorySchemes.statutorySchemeId,
      }),
    },

    statutorySchemes: {
      payrollEntries: r.many.payrollEntries({
        from: r.statutorySchemes.statutorySchemeId,
        to: r.payrollEntries.statutorySchemeId,
      }),
      socialInsuranceProfiles: r.many.socialInsuranceProfiles({
        from: r.statutorySchemes.statutorySchemeId,
        to: r.socialInsuranceProfiles.statutorySchemeId,
      }),
      statutorySchemeRates: r.many.statutorySchemeRates({
        from: r.statutorySchemes.statutorySchemeId,
        to: r.statutorySchemeRates.statutorySchemeId,
      }),
    },

    taxExemptionCategories: {
      tenant: r.one.tenants({
        from: r.taxExemptionCategories.tenantId,
        to: r.tenants.tenantId,
      }),
      taxExemptionDeclarationEntries: r.many.taxExemptionDeclarationEntries({
        from: r.taxExemptionCategories.categoryId,
        to: r.taxExemptionDeclarationEntries.categoryId,
      }),
    },

    taxExemptionDeclarationEntries: {
      category: r.one.taxExemptionCategories({
        from: r.taxExemptionDeclarationEntries.categoryId,
        to: r.taxExemptionCategories.categoryId,
      }),
      declaration: r.one.taxExemptionDeclarations({
        from: r.taxExemptionDeclarationEntries.declarationId,
        to: r.taxExemptionDeclarations.declarationId,
      }),
    },

    taxExemptionDeclarations: {
      tenant: r.one.tenants({
        from: r.taxExemptionDeclarations.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.taxExemptionDeclarations.employeeId,
        to: r.employees.employeeId,
      }),
      payrollPeriod: r.one.payrollPeriods({
        from: r.taxExemptionDeclarations.payrollPeriodId,
        to: r.payrollPeriods.payrollPeriodId,
      }),
      taxExemptionDeclarationEntries: r.many.taxExemptionDeclarationEntries({
        from: r.taxExemptionDeclarations.declarationId,
        to: r.taxExemptionDeclarationEntries.declarationId,
      }),
    },

    taxProfiles: {
      tenant: r.one.tenants({
        from: r.taxProfiles.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.taxProfiles.employeeId,
        to: r.employees.employeeId,
      }),
    },
  })
);
