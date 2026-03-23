/**
 * Condition Evaluation Tests
 *
 * Tests for the condition DSL evaluator.
 */

import { describe, it, expect } from "vitest";
import { evaluateCondition } from "../metadata/condition";
import type { Condition, ConditionContext } from "../metadata/condition";

describe("evaluateCondition", () => {
  const record = {
    status: "ACTIVE",
    age: 25,
    salary: 50000,
    department: "Engineering",
    is_manager: false,
    tags: ["senior", "remote"],
  };

  describe("static boolean", () => {
    it("returns true for true", () => {
      expect(evaluateCondition(true, record)).toBe(true);
    });

    it("returns false for false", () => {
      expect(evaluateCondition(false, record)).toBe(false);
    });
  });

  describe("comparison expressions", () => {
    it("evaluates eq operator", () => {
      expect(evaluateCondition({ field: "status", op: "eq", value: "ACTIVE" }, record)).toBe(true);
      expect(evaluateCondition({ field: "status", op: "eq", value: "INACTIVE" }, record)).toBe(
        false
      );
    });

    it("evaluates ne operator", () => {
      expect(evaluateCondition({ field: "status", op: "ne", value: "INACTIVE" }, record)).toBe(
        true
      );
      expect(evaluateCondition({ field: "status", op: "ne", value: "ACTIVE" }, record)).toBe(false);
    });

    it("evaluates gt operator", () => {
      expect(evaluateCondition({ field: "age", op: "gt", value: 20 }, record)).toBe(true);
      expect(evaluateCondition({ field: "age", op: "gt", value: 30 }, record)).toBe(false);
    });

    it("evaluates gte operator", () => {
      expect(evaluateCondition({ field: "age", op: "gte", value: 25 }, record)).toBe(true);
      expect(evaluateCondition({ field: "age", op: "gte", value: 26 }, record)).toBe(false);
    });

    it("evaluates lt operator", () => {
      expect(evaluateCondition({ field: "salary", op: "lt", value: 60000 }, record)).toBe(true);
      expect(evaluateCondition({ field: "salary", op: "lt", value: 40000 }, record)).toBe(false);
    });

    it("evaluates lte operator", () => {
      expect(evaluateCondition({ field: "salary", op: "lte", value: 50000 }, record)).toBe(true);
      expect(evaluateCondition({ field: "salary", op: "lte", value: 49999 }, record)).toBe(false);
    });

    it("evaluates in operator", () => {
      expect(
        evaluateCondition({ field: "status", op: "in", value: ["ACTIVE", "PENDING"] }, record)
      ).toBe(true);
      expect(
        evaluateCondition({ field: "status", op: "in", value: ["INACTIVE", "ARCHIVED"] }, record)
      ).toBe(false);
    });

    it("evaluates not_in operator", () => {
      expect(
        evaluateCondition(
          { field: "status", op: "not_in", value: ["INACTIVE", "ARCHIVED"] },
          record
        )
      ).toBe(true);
      expect(
        evaluateCondition({ field: "status", op: "not_in", value: ["ACTIVE", "PENDING"] }, record)
      ).toBe(false);
    });

    it("returns false for undefined field", () => {
      expect(evaluateCondition({ field: "missing", op: "eq", value: "test" }, record)).toBe(false);
    });

    it("handles null comparisons", () => {
      const recordWithNull = { ...record, manager: null };
      expect(evaluateCondition({ field: "manager", op: "eq", value: null }, recordWithNull)).toBe(
        true
      );
      expect(evaluateCondition({ field: "manager", op: "ne", value: null }, recordWithNull)).toBe(
        false
      );
    });
  });

  describe("logical expressions", () => {
    it("evaluates and operator", () => {
      const condition: Condition = {
        op: "and",
        conditions: [
          { field: "status", op: "eq", value: "ACTIVE" },
          { field: "age", op: "gte", value: 18 },
        ],
      };
      expect(evaluateCondition(condition, record)).toBe(true);
    });

    it("evaluates and operator with one false", () => {
      const condition: Condition = {
        op: "and",
        conditions: [
          { field: "status", op: "eq", value: "ACTIVE" },
          { field: "age", op: "gte", value: 30 },
        ],
      };
      expect(evaluateCondition(condition, record)).toBe(false);
    });

    it("evaluates or operator", () => {
      const condition: Condition = {
        op: "or",
        conditions: [
          { field: "status", op: "eq", value: "INACTIVE" },
          { field: "age", op: "gte", value: 18 },
        ],
      };
      expect(evaluateCondition(condition, record)).toBe(true);
    });

    it("evaluates or operator with all false", () => {
      const condition: Condition = {
        op: "or",
        conditions: [
          { field: "status", op: "eq", value: "INACTIVE" },
          { field: "age", op: "lt", value: 18 },
        ],
      };
      expect(evaluateCondition(condition, record)).toBe(false);
    });

    it("handles empty conditions array", () => {
      expect(evaluateCondition({ op: "and", conditions: [] }, record)).toBe(true);
      expect(evaluateCondition({ op: "or", conditions: [] }, record)).toBe(true);
    });

    it("handles nested logical expressions", () => {
      const condition: Condition = {
        op: "and",
        conditions: [
          { field: "status", op: "eq", value: "ACTIVE" },
          {
            op: "or",
            conditions: [
              { field: "age", op: "gte", value: 30 },
              { field: "salary", op: "gte", value: 45000 },
            ],
          },
        ],
      };
      expect(evaluateCondition(condition, record)).toBe(true);
    });
  });

  describe("not operator", () => {
    it("negates a boolean condition", () => {
      expect(evaluateCondition({ op: "not", condition: true }, record)).toBe(false);
      expect(evaluateCondition({ op: "not", condition: false }, record)).toBe(true);
    });

    it("negates a comparison expression", () => {
      expect(
        evaluateCondition(
          { op: "not", condition: { field: "status", op: "eq", value: "ACTIVE" } },
          record
        )
      ).toBe(false);
      expect(
        evaluateCondition(
          { op: "not", condition: { field: "status", op: "eq", value: "INACTIVE" } },
          record
        )
      ).toBe(true);
    });

    it("negates a logical expression", () => {
      expect(
        evaluateCondition(
          {
            op: "not",
            condition: {
              op: "and",
              conditions: [
                { field: "status", op: "eq", value: "ACTIVE" },
                { field: "age", op: "gte", value: 18 },
              ],
            },
          },
          record
        )
      ).toBe(false);
    });

    it("handles double negation", () => {
      expect(
        evaluateCondition({ op: "not", condition: { op: "not", condition: true } }, record)
      ).toBe(true);
    });
  });

  describe("context support", () => {
    it("evaluates conditions against context values", () => {
      const context: ConditionContext = {
        uid: 1,
        company_id: 42,
      };

      expect(evaluateCondition({ field: "uid", op: "eq", value: 1 }, {}, undefined, context)).toBe(
        true
      );
      expect(
        evaluateCondition({ field: "company_id", op: "eq", value: 42 }, {}, undefined, context)
      ).toBe(true);
    });

    it("record values take priority over context", () => {
      const context: ConditionContext = {
        uid: 1,
      };
      const recordWithUid = { uid: 2 };

      expect(
        evaluateCondition({ field: "uid", op: "eq", value: 2 }, recordWithUid, undefined, context)
      ).toBe(true);
      expect(
        evaluateCondition({ field: "uid", op: "eq", value: 1 }, recordWithUid, undefined, context)
      ).toBe(false);
    });

    it("uses context for date-based conditions", () => {
      const context: ConditionContext = {
        today: "2024-03-15",
      };

      expect(
        evaluateCondition({ field: "today", op: "eq", value: "2024-03-15" }, {}, undefined, context)
      ).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles type mismatches gracefully", () => {
      expect(evaluateCondition({ field: "age", op: "gt", value: "not a number" }, record)).toBe(
        false
      );
    });

    it("handles invalid operators gracefully", () => {
      expect(
        evaluateCondition({ field: "status", op: "invalid" as any, value: "test" }, record)
      ).toBe(false);
    });

    it("handles deeply nested conditions", () => {
      const condition: Condition = {
        op: "and",
        conditions: [
          {
            op: "or",
            conditions: [
              { op: "not", condition: { field: "is_manager", op: "eq", value: true } },
              { field: "department", op: "eq", value: "Engineering" },
            ],
          },
          { field: "age", op: "gte", value: 18 },
        ],
      };
      expect(evaluateCondition(condition, record)).toBe(true);
    });
  });
});
