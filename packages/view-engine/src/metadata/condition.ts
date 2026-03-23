/**
 * Metadata — Condition DSL
 *
 * Deterministic, side-effect-free condition evaluation for controlling
 * field visibility, readonly state, and required flags.
 *
 * @version 1.0.0 — initial release
 */

/**
 * Comparison operators for field value checks.
 * Closed set — no arbitrary expressions allowed.
 */
export type ComparisonOp = "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "in" | "not_in";

/**
 * Comparison expression — checks a field value against a constant.
 */
export interface ComparisonExpr {
  field: string;
  op: ComparisonOp;
  value: unknown;
}

/**
 * Logical combinator — AND or OR multiple conditions.
 */
export interface LogicalExpr {
  op: "and" | "or";
  conditions: Condition[];
}

/**
 * Negation expression — inverts a condition.
 */
export interface NotExpr {
  op: "not";
  condition: Condition;
}

/**
 * A condition is either a static boolean, a comparison, a logical combinator, or a negation.
 */
export type Condition = boolean | ComparisonExpr | LogicalExpr | NotExpr;

/**
 * Formula definition for computed fields.
 * The client does NOT execute arithmetic — it references a named server-side
 * compute key.
 */
export interface Formula {
  /** Field names this formula depends on. */
  deps: string[];
  /** Server-side compute key (e.g., "compute_salary_band"). */
  compute: string;
}

/**
 * Condition evaluation context.
 * Provides access to user, company, and date values in conditions.
 * Merged with record values (record takes priority).
 */
export interface ConditionContext {
  /** Current user ID. */
  uid?: number;
  /** Current company ID. */
  company_id?: number;
  /** Today's date (ISO string). */
  today?: string;
  /** Additional context values. */
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Condition Evaluator
// ---------------------------------------------------------------------------

/**
 * Evaluates a condition against a record.
 *
 * **Guarantees:**
 * - Pure function (no side effects, except dev-mode logging)
 * - Deterministic (same inputs → same output)
 * - Synchronous
 * - No exceptions (returns `false` on error)
 *
 * **Evaluation rules:**
 * - Undefined field → `false`
 * - Type mismatch → `false`
 * - Empty conditions array → `true`
 * - Null checks → use `{ field: "x", op: "eq", value: null }`
 * - Context values merged with record (record takes priority)
 *
 * @param condition - The condition to evaluate
 * @param record - The record to evaluate against
 * @param fieldName - Optional field name for devtools logging
 * @param context - Optional context (user, company, date)
 * @returns `true` if the condition is satisfied, `false` otherwise
 */
export function evaluateCondition(
  condition: Condition,
  record: Record<string, unknown>,
  fieldName?: string,
  context?: ConditionContext
): boolean {
  // Merge context with record (record values take priority)
  const mergedData = context ? { ...context, ...record } : record;
  const result = evaluateConditionInternal(condition, mergedData);

  // Log to devtools in development
  if (process.env.NODE_ENV !== "production" && fieldName) {
    // Import dynamically to avoid circular dependency
    import("../devtools/view-engine-devtools")
      .then(({ pushConditionLog }) => {
        pushConditionLog({
          field: fieldName,
          condition,
          result,
          record,
          timestamp: Date.now(),
        });
      })
      .catch(() => {
        // Devtools not available, silently skip
      });
  }

  return result;
}

function evaluateConditionInternal(condition: Condition, record: Record<string, unknown>): boolean {
  // Static boolean
  if (typeof condition === "boolean") {
    return condition;
  }

  // Negation
  if ("op" in condition && condition.op === "not") {
    const notExpr = condition as NotExpr;
    return !evaluateConditionInternal(notExpr.condition, record);
  }

  // Logical combinator
  if ("op" in condition && (condition.op === "and" || condition.op === "or")) {
    const logical = condition as LogicalExpr;
    if (logical.conditions.length === 0) return true;

    if (logical.op === "and") {
      return logical.conditions.every((c) => evaluateConditionInternal(c, record));
    } else {
      return logical.conditions.some((c) => evaluateConditionInternal(c, record));
    }
  }

  // Comparison expression
  const comparison = condition as ComparisonExpr;
  const fieldValue = record[comparison.field];

  // Undefined field → false
  if (fieldValue === undefined) {
    return false;
  }

  switch (comparison.op) {
    case "eq":
      return fieldValue === comparison.value;

    case "ne":
      return fieldValue !== comparison.value;

    case "gt":
      // Type mismatch → false
      if (typeof fieldValue !== "number" || typeof comparison.value !== "number") {
        return false;
      }
      return fieldValue > comparison.value;

    case "lt":
      if (typeof fieldValue !== "number" || typeof comparison.value !== "number") {
        return false;
      }
      return fieldValue < comparison.value;

    case "gte":
      if (typeof fieldValue !== "number" || typeof comparison.value !== "number") {
        return false;
      }
      return fieldValue >= comparison.value;

    case "lte":
      if (typeof fieldValue !== "number" || typeof comparison.value !== "number") {
        return false;
      }
      return fieldValue <= comparison.value;

    case "in":
      if (!Array.isArray(comparison.value)) {
        return false;
      }
      return comparison.value.includes(fieldValue);

    case "not_in":
      if (!Array.isArray(comparison.value)) {
        return false;
      }
      return !comparison.value.includes(fieldValue);

    default:
      return false;
  }
}
