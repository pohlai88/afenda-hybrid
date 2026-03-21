/**
 * Payroll relational graph for Drizzle RQB (`db.query.*`).
 * Wired with security and benefits in `src/db/db.ts`.
 *
 * Optional `one` relations include: `payComponents.earningsType` / `deductionType`, `bankAccounts.currency`,
 * `socialInsuranceProfiles.statutoryScheme` / `legalEntity`, `payrollEntries.payComponent` / `statutoryScheme`,
 * `payrollRuns.processor` / `approver`, `paymentRecords.bankAccount`, `expenseClaims.approver`, `loanRecords.approver`,
 * `finalSettlements.processor` / `approver`, and optional `legalEntity` on `payrollPeriods` / `payrollRuns`.
 *
 * Contract test: `src/db/__tests__/payroll-rqb-nested-relations.test.ts`.
 */
import { defineRelations } from "drizzle-orm";
import { currencies } from "../../schema-platform/core/currencies";
import { legalEntities } from "../../schema-platform/core/legalEntities";
import { tenants } from "../../schema-platform/core/tenants";
import { jobGrades } from "../hr/employment/jobGrades";
import { employees } from "../hr/fundamentals/employees";
import {
  bankAccounts,
  compensationPackages,
  deductionTypes,
  earningsTypes,
  expenseTypes,
  payComponents,
  payGradeStructures,
  socialInsuranceProfiles,
  statutorySchemeRates,
  statutorySchemes,
  taxProfiles,
} from "./fundamentals";
import {
  expenseClaims,
  finalSettlements,
  loanRecords,
  paymentRecords,
  payrollEntries,
  payrollPeriods,
  payrollRuns,
  payslips,
} from "./operations";

export const payrollRelations = defineRelations(
  {
    tenants,
    currencies,
    legalEntities,
    employees,
    jobGrades,
    compensationPackages,
    payComponents,
    payGradeStructures,
    earningsTypes,
    deductionTypes,
    expenseTypes,
    bankAccounts,
    taxProfiles,
    socialInsuranceProfiles,
    statutorySchemes,
    statutorySchemeRates,
    payrollPeriods,
    payrollRuns,
    payrollEntries,
    payslips,
    paymentRecords,
    expenseClaims,
    loanRecords,
    finalSettlements,
  },
  (r) => ({
    compensationPackages: {
      tenant: r.one.tenants({
        from: r.compensationPackages.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.compensationPackages.employeeId,
        to: r.employees.employeeId,
      }),
      currency: r.one.currencies({
        from: r.compensationPackages.currencyId,
        to: r.currencies.currencyId,
      }),
    },
    payComponents: {
      tenant: r.one.tenants({
        from: r.payComponents.tenantId,
        to: r.tenants.tenantId,
      }),
      earningsType: r.one.earningsTypes({
        from: r.payComponents.earningsTypeId,
        to: r.earningsTypes.earningsTypeId,
        optional: true,
      }),
      deductionType: r.one.deductionTypes({
        from: r.payComponents.deductionTypeId,
        to: r.deductionTypes.deductionTypeId,
        optional: true,
      }),
      payrollEntries: r.many.payrollEntries({
        from: r.payComponents.payComponentId,
        to: r.payrollEntries.payComponentId,
      }),
    },
    payGradeStructures: {
      tenant: r.one.tenants({
        from: r.payGradeStructures.tenantId,
        to: r.tenants.tenantId,
      }),
      jobGrade: r.one.jobGrades({
        from: r.payGradeStructures.jobGradeId,
        to: r.jobGrades.jobGradeId,
      }),
      currency: r.one.currencies({
        from: r.payGradeStructures.currencyId,
        to: r.currencies.currencyId,
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
    bankAccounts: {
      tenant: r.one.tenants({
        from: r.bankAccounts.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.bankAccounts.employeeId,
        to: r.employees.employeeId,
      }),
      currency: r.one.currencies({
        from: r.bankAccounts.currencyId,
        to: r.currencies.currencyId,
        optional: true,
      }),
      paymentRecords: r.many.paymentRecords({
        from: r.bankAccounts.bankAccountId,
        to: r.paymentRecords.bankAccountId,
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
    socialInsuranceProfiles: {
      tenant: r.one.tenants({
        from: r.socialInsuranceProfiles.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.socialInsuranceProfiles.employeeId,
        to: r.employees.employeeId,
      }),
      statutoryScheme: r.one.statutorySchemes({
        from: r.socialInsuranceProfiles.statutorySchemeId,
        to: r.statutorySchemes.statutorySchemeId,
        optional: true,
      }),
      legalEntity: r.one.legalEntities({
        from: r.socialInsuranceProfiles.legalEntityId,
        to: r.legalEntities.legalEntityId,
        optional: true,
      }),
    },
    statutorySchemes: {
      rates: r.many.statutorySchemeRates({
        from: r.statutorySchemes.statutorySchemeId,
        to: r.statutorySchemeRates.statutorySchemeId,
      }),
      socialInsuranceProfiles: r.many.socialInsuranceProfiles({
        from: r.statutorySchemes.statutorySchemeId,
        to: r.socialInsuranceProfiles.statutorySchemeId,
      }),
      payrollEntries: r.many.payrollEntries({
        from: r.statutorySchemes.statutorySchemeId,
        to: r.payrollEntries.statutorySchemeId,
      }),
    },
    statutorySchemeRates: {
      statutoryScheme: r.one.statutorySchemes({
        from: r.statutorySchemeRates.statutorySchemeId,
        to: r.statutorySchemes.statutorySchemeId,
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
      payrollRuns: r.many.payrollRuns({
        from: r.payrollPeriods.payrollPeriodId,
        to: r.payrollRuns.payrollPeriodId,
      }),
    },
    payrollRuns: {
      tenant: r.one.tenants({
        from: r.payrollRuns.tenantId,
        to: r.tenants.tenantId,
      }),
      period: r.one.payrollPeriods({
        from: r.payrollRuns.payrollPeriodId,
        to: r.payrollPeriods.payrollPeriodId,
      }),
      legalEntity: r.one.legalEntities({
        from: r.payrollRuns.legalEntityId,
        to: r.legalEntities.legalEntityId,
        optional: true,
      }),
      currency: r.one.currencies({
        from: r.payrollRuns.currencyId,
        to: r.currencies.currencyId,
      }),
      processor: r.one.employees({
        from: r.payrollRuns.processedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "payroll_run_processor",
      }),
      approver: r.one.employees({
        from: r.payrollRuns.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "payroll_run_approver",
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
    payrollEntries: {
      tenant: r.one.tenants({
        from: r.payrollEntries.tenantId,
        to: r.tenants.tenantId,
      }),
      payrollRun: r.one.payrollRuns({
        from: r.payrollEntries.payrollRunId,
        to: r.payrollRuns.payrollRunId,
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
      statutoryScheme: r.one.statutorySchemes({
        from: r.payrollEntries.statutorySchemeId,
        to: r.statutorySchemes.statutorySchemeId,
        optional: true,
      }),
    },
    payslips: {
      tenant: r.one.tenants({
        from: r.payslips.tenantId,
        to: r.tenants.tenantId,
      }),
      payrollRun: r.one.payrollRuns({
        from: r.payslips.payrollRunId,
        to: r.payrollRuns.payrollRunId,
      }),
      employee: r.one.employees({
        from: r.payslips.employeeId,
        to: r.employees.employeeId,
      }),
      currency: r.one.currencies({
        from: r.payslips.currencyId,
        to: r.currencies.currencyId,
      }),
      paymentRecords: r.many.paymentRecords({
        from: r.payslips.payslipId,
        to: r.paymentRecords.payslipId,
      }),
    },
    paymentRecords: {
      tenant: r.one.tenants({
        from: r.paymentRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      payslip: r.one.payslips({
        from: r.paymentRecords.payslipId,
        to: r.payslips.payslipId,
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
    },
    expenseClaims: {
      tenant: r.one.tenants({
        from: r.expenseClaims.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.expenseClaims.employeeId,
        to: r.employees.employeeId,
      }),
      expenseType: r.one.expenseTypes({
        from: r.expenseClaims.expenseTypeId,
        to: r.expenseTypes.expenseTypeId,
      }),
      currency: r.one.currencies({
        from: r.expenseClaims.currencyId,
        to: r.currencies.currencyId,
      }),
      approver: r.one.employees({
        from: r.expenseClaims.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "expense_claim_approver",
      }),
    },
    loanRecords: {
      tenant: r.one.tenants({
        from: r.loanRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.loanRecords.employeeId,
        to: r.employees.employeeId,
      }),
      currency: r.one.currencies({
        from: r.loanRecords.currencyId,
        to: r.currencies.currencyId,
      }),
      approver: r.one.employees({
        from: r.loanRecords.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "loan_approver",
      }),
    },
    finalSettlements: {
      tenant: r.one.tenants({
        from: r.finalSettlements.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.finalSettlements.employeeId,
        to: r.employees.employeeId,
      }),
      currency: r.one.currencies({
        from: r.finalSettlements.currencyId,
        to: r.currencies.currencyId,
      }),
      processor: r.one.employees({
        from: r.finalSettlements.processedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "settlement_processor",
      }),
      approver: r.one.employees({
        from: r.finalSettlements.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "settlement_approver",
      }),
    },
  })
);
