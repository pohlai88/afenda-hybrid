import { z } from "zod/v4";

import {
  nullableOptional,
  dateStringSchema,
  dateOptionalSchema,
  dateNullableOptionalSchema,
  dateCoerceSchema,
  isParseableTimestamptzString,
  timestamptzStringSchema,
  timestamptzOptionalSchema,
  timestamptzNullableOptionalSchema,
  timestamptzWireNullableOptionalSchema,
  isoDateWireString,
  parseUnknownToEpochMs,
} from "../../_shared/zodWire";

/**
 * HR domain Zod: bounds, re-exported wire formats from `_shared/zodWire`, and cross-field refinements.
 * Keep literals in sync with `check()` in table files / migrations; document in `hr/README.md`.
 */

export {
  nullableOptional,
  dateStringSchema,
  dateOptionalSchema,
  dateNullableOptionalSchema,
  dateCoerceSchema,
  isParseableTimestamptzString,
  timestamptzStringSchema,
  timestamptzOptionalSchema,
  timestamptzNullableOptionalSchema,
  timestamptzWireNullableOptionalSchema,
  isoDateWireString,
  parseUnknownToEpochMs,
};

// ---------------------------------------------------------------------------
// Numeric / text bounds (Zod; mirror in Drizzle `check()` when introducing new SQL)
// ---------------------------------------------------------------------------

export const hrBounds = {
  /** `leave_requests.totalDays` — numeric(4,1), must be > 0 in DB */
  leaveTotalDaysMax: 999.9,
  notesMax: 2000,
  reasonMax: 2000,
  employeeCodeMax: 50,
  employeeCodeMin: 2,
  positionCodeMax: 50,
  positionCodeMin: 2,
  contractCodeMax: 50,
  contractCodeMin: 2,
  /** `positions` salary — numeric(12,2) */
  positionSalaryNumericMax: 99_999_999_999.99,
  positionHeadcountMax: 1000,
} as const;

/** Minimum hire date — matches `chk_employees_hire_date` */
export const HR_MIN_HIRE_DATE = "1900-01-01";

// ---------------------------------------------------------------------------
// `leave_requests.totalDays` — numeric string (matches Drizzle numeric as string)
// ---------------------------------------------------------------------------

export function isValidLeaveTotalDaysString(val: string): boolean {
  if (!/^\d+(\.\d)?$/.test(val)) return false;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 && n <= hrBounds.leaveTotalDaysMax;
}

export const leaveTotalDaysStringSchema = z.string().refine(isValidLeaveTotalDaysString, {
  message: `totalDays must be positive and at most ${hrBounds.leaveTotalDaysMax} (one decimal place)`,
});

// ---------------------------------------------------------------------------
// `positions` — numeric(12,2) salary strings, FTE (numeric 3,2)
// ---------------------------------------------------------------------------

/** `numeric(12,2)` non-negative salary band (positions, job grades). */
export function isValidHrSalary12_2String(val: string): boolean {
  if (!/^\d+(\.\d{1,2})?$/.test(val)) return false;
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 && n <= hrBounds.positionSalaryNumericMax;
}

export const hrSalary12_2StringSchema = z.string().refine(isValidHrSalary12_2String, {
  message: `salary must be a non-negative decimal(12,2) up to ${hrBounds.positionSalaryNumericMax}`,
});

export const positionSalaryStringSchema = hrSalary12_2StringSchema;

export function parseOptionalSalary12_2(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string") return null;
  if (!isValidHrSalary12_2String(v)) return null;
  return Number(v);
}

/** Matches `chk_positions_salary_range` and `chk_positions_salary_positive`. */
export function refinePositionSalaryOrderAndBounds<
  T extends { minSalary?: unknown; maxSalary?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const minRaw = data.minSalary;
  const maxRaw = data.maxSalary;
  if (typeof minRaw === "string" && minRaw !== "" && !isValidHrSalary12_2String(minRaw)) {
    ctx.addIssue({
      code: "custom",
      message: "minSalary must be a valid non-negative decimal(12,2)",
      path: ["minSalary"],
    });
  }
  if (typeof maxRaw === "string" && maxRaw !== "" && !isValidHrSalary12_2String(maxRaw)) {
    ctx.addIssue({
      code: "custom",
      message: "maxSalary must be a valid non-negative decimal(12,2)",
      path: ["maxSalary"],
    });
  }
  const min = parseOptionalSalary12_2(minRaw);
  const max = parseOptionalSalary12_2(maxRaw);
  if (min !== null && max !== null && min > max) {
    ctx.addIssue({
      code: "custom",
      message: "maxSalary must be greater than or equal to minSalary when both are set",
      path: ["maxSalary"],
    });
  }
}

const FTE_STRING = /^\d+(\.\d{1,2})?$/;

export function isValidPositionFteString(val: string): boolean {
  if (!FTE_STRING.test(val)) return false;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 && n <= 1;
}

export const positionFteStringSchema = z.string().refine(isValidPositionFteString, {
  message: "fte must be greater than 0 and at most 1",
});

// ---------------------------------------------------------------------------
// `employment_contracts` — hours numeric(4,1), date ordering CHECKs
// ---------------------------------------------------------------------------

export function isValidContractHoursString(val: string): boolean {
  if (!/^\d+(\.\d)?$/.test(val)) return false;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 && n <= 168;
}

export const contractWorkingHoursStringSchema = z.string().refine(isValidContractHoursString, {
  message: "workingHoursPerWeek must be greater than 0 and at most 168 (one decimal place)",
});

/** `work_schedules.weeklyHours` — numeric(4,1), same (0, 168] bound as contract hours in Zod. */
export const weeklyHours41StringSchema = z.string().refine(isValidContractHoursString, {
  message: "weeklyHours must be greater than 0 and at most 168 (one decimal place)",
});

/** `endDate` >= `startDate` when both ISO dates. Matches `chk_employment_contracts_dates`. */
export function refineContractEndOnOrAfterStart<
  T extends { startDate?: unknown; endDate?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const s = isoDateWireString(data.startDate);
  const e = isoDateWireString(data.endDate);
  if (s === null || e === null) return;
  if (e < s) {
    ctx.addIssue({
      code: "custom",
      message: "endDate must be on or after startDate",
      path: ["endDate"],
    });
  }
}

/** `probationEndDate` >= `startDate` when both set. Matches `chk_employment_contracts_probation`. */
export function refineProbationEndOnOrAfterStart<
  T extends { startDate?: unknown; probationEndDate?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const s = isoDateWireString(data.startDate);
  const p = isoDateWireString(data.probationEndDate);
  if (s === null || p === null) return;
  if (p < s) {
    ctx.addIssue({
      code: "custom",
      message: "probationEndDate must be on or after startDate",
      path: ["probationEndDate"],
    });
  }
}

/** `noticePeriodDays` >= 0 when present. Matches `chk_employment_contracts_notice_period`. */
export function refineNoticePeriodDaysNonNegative<T extends { noticePeriodDays?: unknown }>(
  data: T,
  ctx: z.RefinementCtx
): void {
  const n = data.noticePeriodDays;
  if (n === undefined || n === null) return;
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num) || num < 0) {
    ctx.addIssue({
      code: "custom",
      message: "noticePeriodDays must be >= 0 when set",
      path: ["noticePeriodDays"],
    });
  }
}

/** `workingHoursPerWeek` CHECK: null or (0, 168]. Matches `chk_employment_contracts_hours`. */
export function refineContractWorkingHoursString<T extends { workingHoursPerWeek?: unknown }>(
  data: T,
  ctx: z.RefinementCtx
): void {
  const w = data.workingHoursPerWeek;
  if (w === undefined || w === null || w === "") return;
  if (typeof w !== "string" || !isValidContractHoursString(w)) {
    ctx.addIssue({
      code: "custom",
      message: "workingHoursPerWeek must be between 0 and 168 exclusive of 0 (one decimal place)",
      path: ["workingHoursPerWeek"],
    });
  }
}

// ---------------------------------------------------------------------------
// Effective date ranges (`effectiveTo` / `effectiveFrom`, `periodEnd` / `periodStart`, …)
// ---------------------------------------------------------------------------

export function refineOptionalIsoEndOnOrAfterStart<T extends Record<string, unknown>>(
  data: T,
  ctx: z.RefinementCtx,
  args: {
    startKey: keyof T & string;
    endKey: keyof T & string;
    issuePath?: string;
    message?: string;
  }
): void {
  const s = isoDateWireString(data[args.startKey]);
  const e = isoDateWireString(data[args.endKey]);
  if (s === null || e === null) return;
  if (e < s) {
    ctx.addIssue({
      code: "custom",
      message:
        args.message ?? `${String(args.endKey)} must be on or after ${String(args.startKey)}`,
      path: [args.issuePath ?? String(args.endKey)],
    });
  }
}

// ---------------------------------------------------------------------------
// Timesheets — `chk_timesheets_period`, `chk_timesheets_hours_positive`
// ---------------------------------------------------------------------------

const NUMERIC_5_2 = /^\d+(\.\d{1,2})?$/;

export function isValidTimesheetHoursString(val: string): boolean {
  if (!NUMERIC_5_2.test(val)) return false;
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 && n <= 999.99;
}

export const timesheetHoursStringSchema = z.string().refine(isValidTimesheetHoursString, {
  message: "hours must be a non-negative decimal(5,2) up to 999.99",
});

export function refineTimesheetHoursNonNegative<T extends Record<string, unknown>>(
  data: T,
  ctx: z.RefinementCtx,
  keys: readonly (keyof T & string)[]
): void {
  for (const key of keys) {
    const v = data[key];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v !== "string" || !isValidTimesheetHoursString(v)) {
      ctx.addIssue({
        code: "custom",
        message: `${String(key)} must be a non-negative decimal(5,2)`,
        path: [String(key)],
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Job grades — `chk_job_grades_*`
// ---------------------------------------------------------------------------

export function refineJobGradeSalaryLadder<
  T extends { minSalary?: unknown; midSalary?: unknown; maxSalary?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const keys = ["minSalary", "midSalary", "maxSalary"] as const;
  for (const k of keys) {
    const raw = data[k];
    if (typeof raw === "string" && raw !== "" && !isValidHrSalary12_2String(raw)) {
      ctx.addIssue({
        code: "custom",
        message: `${k} must be a valid non-negative decimal(12,2)`,
        path: [k],
      });
    }
  }
  const min = parseOptionalSalary12_2(data.minSalary);
  const mid = parseOptionalSalary12_2(data.midSalary);
  const max = parseOptionalSalary12_2(data.maxSalary);
  if (min !== null && max !== null && min > max) {
    ctx.addIssue({
      code: "custom",
      message: "maxSalary must be greater than or equal to minSalary when both are set",
      path: ["maxSalary"],
    });
  }
  if (min !== null && mid !== null && mid < min) {
    ctx.addIssue({
      code: "custom",
      message: "midSalary must be greater than or equal to minSalary when both are set",
      path: ["midSalary"],
    });
  }
  if (mid !== null && max !== null && mid > max) {
    ctx.addIssue({
      code: "custom",
      message: "midSalary must be less than or equal to maxSalary when both are set",
      path: ["midSalary"],
    });
  }
}

// ---------------------------------------------------------------------------
// Secondments — `chk_secondments_*`
// ---------------------------------------------------------------------------

export function refineSecondmentOriginalEndOnOrAfterStart<
  T extends { startDate?: unknown; originalEndDate?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  refineOptionalIsoEndOnOrAfterStart(data as Record<string, unknown>, ctx, {
    startKey: "startDate",
    endKey: "originalEndDate",
    issuePath: "originalEndDate",
  });
}

export function refineSecondmentActualEndOnOrAfterStart<
  T extends { startDate?: unknown; actualEndDate?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const s = isoDateWireString(data.startDate);
  const a = isoDateWireString(data.actualEndDate);
  if (s === null || a === null) return;
  if (a < s) {
    ctx.addIssue({
      code: "custom",
      message: "actualEndDate must be on or after startDate",
      path: ["actualEndDate"],
    });
  }
}

/** `chk_secondments_has_host` on insert. */
export function refineSecondmentAtLeastOneHostOnInsert<
  T extends { hostDepartmentId?: unknown; hostLocationId?: unknown; hostLegalEntityId?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const has = (v: unknown) => v !== undefined && v !== null;
  if (has(data.hostDepartmentId) || has(data.hostLocationId) || has(data.hostLegalEntityId)) return;
  ctx.addIssue({
    code: "custom",
    message: "At least one of hostDepartmentId, hostLocationId, hostLegalEntityId must be set",
    path: ["hostDepartmentId"],
  });
}

/** If a patch includes host columns, do not clear all three to null at once. */
export function refineSecondmentHostPatchNotAllNull<
  T extends { hostDepartmentId?: unknown; hostLocationId?: unknown; hostLegalEntityId?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const pd = data.hostDepartmentId !== undefined;
  const pl = data.hostLocationId !== undefined;
  const pe = data.hostLegalEntityId !== undefined;
  if (!pd && !pl && !pe) return;
  const has = (v: unknown) => v !== undefined && v !== null;
  if (has(data.hostDepartmentId) || has(data.hostLocationId) || has(data.hostLegalEntityId)) return;
  if (
    pd &&
    pl &&
    pe &&
    data.hostDepartmentId === null &&
    data.hostLocationId === null &&
    data.hostLegalEntityId === null
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Cannot set all host dimensions to null in one patch",
      path: ["hostDepartmentId"],
    });
  }
}

// ---------------------------------------------------------------------------
// Employee transfers — `chk_employee_transfers_has_change`
// ---------------------------------------------------------------------------

function pgIsDistinctFrom(a: unknown, b: unknown): boolean {
  if (a === null || a === undefined) return b !== null && b !== undefined;
  if (b === null || b === undefined) return true;
  return a !== b;
}

/** `chk_employee_transfers_has_change` — use on **insert** only (partial updates lack full from/to). */
export function refineEmployeeTransferHasChangeOnInsert<
  T extends {
    fromDepartmentId?: unknown;
    toDepartmentId?: unknown;
    fromLocationId?: unknown;
    toLocationId?: unknown;
    fromPositionId?: unknown;
    toPositionId?: unknown;
  },
>(data: T, ctx: z.RefinementCtx): void {
  const changed =
    pgIsDistinctFrom(data.fromDepartmentId, data.toDepartmentId) ||
    pgIsDistinctFrom(data.fromLocationId, data.toLocationId) ||
    pgIsDistinctFrom(data.fromPositionId, data.toPositionId);
  if (changed) return;
  ctx.addIssue({
    code: "custom",
    message: "At least one of department, location, or position must change between from and to",
    path: ["toDepartmentId"],
  });
}

// ---------------------------------------------------------------------------
// Reporting lines — `chk_reporting_lines_*`
// ---------------------------------------------------------------------------

export function refineReportingLineNotSelf<T extends { employeeId?: unknown; managerId?: unknown }>(
  data: T,
  ctx: z.RefinementCtx
): void {
  const e = data.employeeId;
  const m = data.managerId;
  if (e === undefined || m === undefined) return;
  if (e === m) {
    ctx.addIssue({
      code: "custom",
      message: "employeeId and managerId must differ",
      path: ["managerId"],
    });
  }
}

// ---------------------------------------------------------------------------
// Notice period records — `chk_notice_period_records_*`
// ---------------------------------------------------------------------------

export function refineNoticeExpectedLastOnOrAfterNoticeDate<
  T extends { noticeDate?: unknown; expectedLastDay?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  refineOptionalIsoEndOnOrAfterStart(data as Record<string, unknown>, ctx, {
    startKey: "noticeDate",
    endKey: "expectedLastDay",
    issuePath: "expectedLastDay",
    message: "expectedLastDay must be on or after noticeDate",
  });
}

export function refineNoticeActualLastOnOrAfterNoticeDate<
  T extends { noticeDate?: unknown; actualLastDay?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const n = isoDateWireString(data.noticeDate);
  const a = isoDateWireString(data.actualLastDay);
  if (n === null || a === null) return;
  if (a < n) {
    ctx.addIssue({
      code: "custom",
      message: "actualLastDay must be on or after noticeDate when set",
      path: ["actualLastDay"],
    });
  }
}

// ---------------------------------------------------------------------------
// Probation records — `chk_probation_records_*`
// ---------------------------------------------------------------------------

export function refineProbationOriginalEndOnOrAfterStart<
  T extends { startDate?: unknown; originalEndDate?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  refineOptionalIsoEndOnOrAfterStart(data as Record<string, unknown>, ctx, {
    startKey: "startDate",
    endKey: "originalEndDate",
    issuePath: "originalEndDate",
  });
}

export function refineProbationExtendedOnOrAfterOriginal<
  T extends { originalEndDate?: unknown; extendedEndDate?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const o = isoDateWireString(data.originalEndDate);
  const x = isoDateWireString(data.extendedEndDate);
  if (o === null || x === null) return;
  if (x < o) {
    ctx.addIssue({
      code: "custom",
      message: "extendedEndDate must be on or after originalEndDate when set",
      path: ["extendedEndDate"],
    });
  }
}

export function refineProbationActualEndOnOrAfterStart<
  T extends { startDate?: unknown; actualEndDate?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  refineOptionalIsoEndOnOrAfterStart(data as Record<string, unknown>, ctx, {
    startKey: "startDate",
    endKey: "actualEndDate",
    issuePath: "actualEndDate",
    message: "actualEndDate must be on or after startDate when set",
  });
}

// ---------------------------------------------------------------------------
// Shift swaps — `chk_shift_swaps_different_employees`
// ---------------------------------------------------------------------------

export function refineShiftSwapDifferentEmployees<
  T extends { requestingEmployeeId?: unknown; targetEmployeeId?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const a = data.requestingEmployeeId;
  const b = data.targetEmployeeId;
  if (a === undefined || b === undefined) return;
  if (a === b) {
    ctx.addIssue({
      code: "custom",
      message: "requestingEmployeeId and targetEmployeeId must differ",
      path: ["targetEmployeeId"],
    });
  }
}

// ---------------------------------------------------------------------------
// Leave types — `chk_leave_types_carry_over`
// ---------------------------------------------------------------------------

export function refineLeaveTypeCarryOverMaxNonNegative<
  T extends { allowCarryOver?: unknown; maxCarryOverDays?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  if (data.allowCarryOver !== true) return;
  const m = data.maxCarryOverDays;
  if (m === undefined || m === null) return;
  const n = typeof m === "number" ? m : Number(m);
  if (!Number.isFinite(n) || n < 0) {
    ctx.addIssue({
      code: "custom",
      message: "maxCarryOverDays must be >= 0 when set and allowCarryOver is true",
      path: ["maxCarryOverDays"],
    });
  }
}

// ---------------------------------------------------------------------------
// Leave balances — non-negative numeric(5,2) strings
// ---------------------------------------------------------------------------

export function refineLeaveBalanceQuantityStringsNonNegative<T extends Record<string, unknown>>(
  data: T,
  ctx: z.RefinementCtx
): void {
  refineTimesheetHoursNonNegative(data, ctx, [
    "entitled",
    "used",
    "pending",
    "carriedOver",
  ] as (keyof T & string)[]);
}

// ---------------------------------------------------------------------------
// Overtime — `chk_overtime_records_*`
// ---------------------------------------------------------------------------

export function isValidOvertimeHoursString(val: string): boolean {
  if (!NUMERIC_5_2.test(val)) return false;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 && n <= 24;
}

export const overtimeHoursStringSchema = z.string().refine(isValidOvertimeHoursString, {
  message: "hours must be greater than 0 and at most 24 (decimal 4,2)",
});

const MULT_3_2 = /^\d+(\.\d{1,2})?$/;

export function isValidOvertimeMultiplierString(val: string): boolean {
  if (!MULT_3_2.test(val)) return false;
  const n = Number(val);
  return Number.isFinite(n) && n >= 1;
}

export const overtimeMultiplierStringSchema = z.string().refine(isValidOvertimeMultiplierString, {
  message: "multiplier must be >= 1 (decimal 3,2)",
});

// ---------------------------------------------------------------------------
// Absence records — `chk_absence_records_date` (wire dates vs UTC “today”)
// ---------------------------------------------------------------------------

/**
 * `absenceDate <= CURRENT_DATE` — DB uses session `CURRENT_DATE`; Zod uses the UTC `YYYY-MM-DD`
 * for the same calendar day as `new Date().toISOString()`. Prefer server-side validation for exact parity.
 */
export function refineAbsenceDateNotAfterUtcToday<T extends { absenceDate?: unknown }>(
  data: T,
  ctx: z.RefinementCtx
): void {
  const d = isoDateWireString(data.absenceDate);
  if (d === null) return;
  const todayUtc = new Date().toISOString().slice(0, 10);
  if (d > todayUtc) {
    ctx.addIssue({
      code: "custom",
      message: `absenceDate must not be after today (UTC ${todayUtc})`,
      path: ["absenceDate"],
    });
  }
}

// ---------------------------------------------------------------------------
// Cross-field refinements (employees, leave, attendance)
// ---------------------------------------------------------------------------

export function normEnumString(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  return String(v);
}

export function isNonEmptyTrimmedText(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

export function refineFieldWhenStatusEquals<T extends Record<string, unknown>>(
  data: T,
  ctx: z.RefinementCtx,
  args: {
    statusKey: keyof T & string;
    fieldKey: keyof T & string;
    whenStatusEquals: string;
    isFieldEmpty: (v: unknown) => boolean;
  }
): void {
  const st = normEnumString(data[args.statusKey]);
  const fv = data[args.fieldKey];
  if (st === args.whenStatusEquals && args.isFieldEmpty(fv)) {
    ctx.addIssue({
      code: "custom",
      message: `${String(args.fieldKey)} is required when ${String(args.statusKey)} is ${args.whenStatusEquals}`,
      path: [args.fieldKey],
    });
  }
  if (!args.isFieldEmpty(fv) && st !== undefined && st !== args.whenStatusEquals) {
    ctx.addIssue({
      code: "custom",
      message: `${String(args.fieldKey)} may only be set when ${String(args.statusKey)} is ${args.whenStatusEquals}`,
      path: [args.fieldKey],
    });
  }
}

export function refineEndDateOnOrAfterStartDate<
  T extends { startDate?: unknown; endDate?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const s = isoDateWireString(data.startDate);
  const e = isoDateWireString(data.endDate);
  if (s === null || e === null) return;
  if (e < s) {
    ctx.addIssue({
      code: "custom",
      message: "endDate must be on or after startDate",
      path: ["endDate"],
    });
  }
}

export function refineTerminationOnOrAfterHire<
  T extends { hireDate?: unknown; terminationDate?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const h = isoDateWireString(data.hireDate);
  const t = isoDateWireString(data.terminationDate);
  if (h === null || t === null) return;
  if (t < h) {
    ctx.addIssue({
      code: "custom",
      message: "terminationDate must be on or after hireDate",
      path: ["terminationDate"],
    });
  }
}

export function refineHireDateMin<T extends { hireDate?: unknown }>(
  data: T,
  ctx: z.RefinementCtx
): void {
  const h = isoDateWireString(data.hireDate);
  if (h === null) return;
  if (h < HR_MIN_HIRE_DATE) {
    ctx.addIssue({
      code: "custom",
      message: `hireDate must be on or after ${HR_MIN_HIRE_DATE}`,
      path: ["hireDate"],
    });
  }
}

export function refineTerminatedRequiresTerminationDate<
  T extends { status?: unknown; terminationDate?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const emptyDate = (v: unknown) => v === undefined || v === null || v === "";
  refineFieldWhenStatusEquals(data as Record<string, unknown>, ctx, {
    statusKey: "status",
    fieldKey: "terminationDate",
    whenStatusEquals: "TERMINATED",
    isFieldEmpty: emptyDate,
  });
}

export function refineLeaveApprovedRequiresApproverAndTime<
  T extends { status?: unknown; approvedBy?: unknown; approvedAt?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  if (normEnumString(data.status) !== "APPROVED") return;
  if (data.approvedBy === undefined || data.approvedBy === null) {
    ctx.addIssue({
      code: "custom",
      message: "approvedBy is required when status is APPROVED",
      path: ["approvedBy"],
    });
  }
  const at = data.approvedAt;
  if (at === undefined || at === null || at === "") {
    ctx.addIssue({
      code: "custom",
      message: "approvedAt is required when status is APPROVED",
      path: ["approvedAt"],
    });
  }
}

export function refineLeaveRejectedRequiresReason<
  T extends { status?: unknown; rejectionReason?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  if (normEnumString(data.status) !== "REJECTED") return;
  if (!isNonEmptyTrimmedText(data.rejectionReason)) {
    ctx.addIssue({
      code: "custom",
      message: "rejectionReason is required when status is REJECTED",
      path: ["rejectionReason"],
    });
  }
}

/** Matches `chk_attendance_checkout_after_checkin` for string or `Date` payloads. */
export function refineCheckOutAfterCheckIn<T extends { checkInAt?: unknown; checkOutAt?: unknown }>(
  data: T,
  ctx: z.RefinementCtx
): void {
  const a = parseUnknownToEpochMs(data.checkInAt);
  const b = parseUnknownToEpochMs(data.checkOutAt);
  if (a === null || b === null) return;
  if (b <= a) {
    ctx.addIssue({
      code: "custom",
      message: "checkOutAt must be after checkInAt when both are set",
      path: ["checkOutAt"],
    });
  }
}
