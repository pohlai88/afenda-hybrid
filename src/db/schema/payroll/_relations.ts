import { defineRelations } from "drizzle-orm";
import { tenants } from "../core/tenants";
import { currencies } from "../core/currencies";
import { employees } from "../hr/fundamentals/employees";
import { compensationPackages } from "./fundamentals/compensationPackages";
import { payComponents } from "./fundamentals/payComponents";
import { payGradeStructures } from "./fundamentals/payGradeStructures";
import { earningsTypes } from "./fundamentals/earningsTypes";
import { deductionTypes } from "./fundamentals/deductionTypes";
import { expenseTypes } from "./fundamentals/expenseTypes";
import { bankAccounts } from "./fundamentals/bankAccounts";
import { taxProfiles } from "./fundamentals/taxProfiles";
import { socialInsuranceProfiles } from "./fundamentals/socialInsuranceProfiles";
import { jobGrades } from "../hr/employment/jobGrades";
import { payrollPeriods } from "./operations/payrollPeriods";
import { payrollRuns } from "./operations/payrollRuns";
import { payrollEntries } from "./operations/payrollEntries";
import { payslips } from "./operations/payslips";
import { paymentRecords } from "./operations/paymentRecords";
import { expenseClaims } from "./operations/expenseClaims";
import { loanRecords } from "./operations/loanRecords";
import { finalSettlements } from "./operations/finalSettlements";

export const payrollRelations = defineRelations(
  {
    tenants,
    currencies,
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
    },
    deductionTypes: {
      tenant: r.one.tenants({
        from: r.deductionTypes.tenantId,
        to: r.tenants.tenantId,
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
    },
    payrollPeriods: {
      tenant: r.one.tenants({
        from: r.payrollPeriods.tenantId,
        to: r.tenants.tenantId,
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
