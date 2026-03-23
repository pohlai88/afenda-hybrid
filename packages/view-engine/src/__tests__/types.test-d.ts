/**
 * Type-level tests for metadata contracts
 *
 * These tests run at compile time to ensure type invariants are maintained.
 * They catch breaking changes to metadata contracts before runtime.
 */

import { describe, test, expectTypeOf } from "vitest";
import type {
  ModelDef,
  ViewDef,
  Condition,
  LayoutNode,
  FieldDef,
  StateMachineDef,
  ConditionContext,
} from "../metadata";
import type { WidgetRenderProps, CellRenderProps } from "../registry/widget-registry";

describe("Metadata Contract Types", () => {
  test("ModelDef requires version field", () => {
    expectTypeOf<ModelDef>().toHaveProperty("version");
    expectTypeOf<ModelDef["version"]>().toEqualTypeOf<1>();
  });

  test("ModelDef has required fields", () => {
    expectTypeOf<ModelDef>().toHaveProperty("name");
    expectTypeOf<ModelDef>().toHaveProperty("label");
    expectTypeOf<ModelDef>().toHaveProperty("fields");
    expectTypeOf<ModelDef["fields"]>().toMatchTypeOf<Record<string, FieldDef>>();
  });

  test("ViewDef requires version field", () => {
    expectTypeOf<ViewDef>().toHaveProperty("version");
    expectTypeOf<ViewDef["version"]>().toEqualTypeOf<1>();
  });

  test("ViewDef.kind is sealed to 3 canonical views", () => {
    expectTypeOf<ViewDef["kind"]>().toEqualTypeOf<"list" | "form" | "kanban">();
  });

  test("Condition is discriminated union", () => {
    // Test that Condition can be assigned from each variant
    expectTypeOf<boolean>().toMatchTypeOf<Condition>();
    expectTypeOf<{ field: string; op: "eq"; value: unknown }>().toMatchTypeOf<Condition>();
    expectTypeOf<{ op: "and"; conditions: Condition[] }>().toMatchTypeOf<Condition>();
    expectTypeOf<{ op: "not"; condition: Condition }>().toMatchTypeOf<Condition>();
  });

  test("LayoutNode kinds are sealed", () => {
    expectTypeOf<LayoutNode["kind"]>().toEqualTypeOf<
      "field" | "group" | "notebook" | "separator"
    >();
  });

  test("FieldDef.type includes expected types", () => {
    // Test that specific types can be assigned to FieldDef["type"]
    expectTypeOf<"char">().toMatchTypeOf<FieldDef["type"]>();
    expectTypeOf<"text">().toMatchTypeOf<FieldDef["type"]>();
    expectTypeOf<"integer">().toMatchTypeOf<FieldDef["type"]>();
    expectTypeOf<"boolean">().toMatchTypeOf<FieldDef["type"]>();
    expectTypeOf<"selection">().toMatchTypeOf<FieldDef["type"]>();
    expectTypeOf<"many2one">().toMatchTypeOf<FieldDef["type"]>();
  });

  test("FieldDef.readonly accepts boolean or Condition", () => {
    // Test that both boolean and Condition can be assigned
    expectTypeOf<boolean>().toMatchTypeOf<NonNullable<FieldDef["readonly"]>>();
    expectTypeOf<Condition>().toMatchTypeOf<NonNullable<FieldDef["readonly"]>>();
  });

  test("FieldDef.invisible accepts boolean or Condition", () => {
    // Test that both boolean and Condition can be assigned
    expectTypeOf<boolean>().toMatchTypeOf<NonNullable<FieldDef["invisible"]>>();
    expectTypeOf<Condition>().toMatchTypeOf<NonNullable<FieldDef["invisible"]>>();
  });

  test("StateMachineDef has required structure", () => {
    expectTypeOf<StateMachineDef>().toHaveProperty("field");
    expectTypeOf<StateMachineDef>().toHaveProperty("states");
    expectTypeOf<StateMachineDef["states"]>().toBeArray();
  });

  test("ConditionContext has optional standard fields", () => {
    expectTypeOf<ConditionContext>().toMatchTypeOf<{
      uid?: number;
      company_id?: number;
      today?: string;
    }>();
  });

  test("WidgetRenderProps has required fields", () => {
    expectTypeOf<WidgetRenderProps>().toHaveProperty("field");
    expectTypeOf<WidgetRenderProps>().toHaveProperty("value");
    expectTypeOf<WidgetRenderProps["onChange"]>().toMatchTypeOf<
      ((value: unknown) => void) | undefined
    >();
  });

  test("CellRenderProps extends WidgetRenderProps", () => {
    expectTypeOf<CellRenderProps>().toMatchTypeOf<{
      field: FieldDef;
      value: unknown;
    }>();
  });

  test("WidgetRenderProps includes onSearch for relations", () => {
    expectTypeOf<WidgetRenderProps["onSearch"]>().toMatchTypeOf<
      ((query: string) => Promise<Array<{ value: string; label: string }>>) | undefined
    >();
  });

  test("WidgetRenderProps includes displayValue for relations", () => {
    expectTypeOf<WidgetRenderProps["displayValue"]>().toMatchTypeOf<string | undefined>();
  });
});
