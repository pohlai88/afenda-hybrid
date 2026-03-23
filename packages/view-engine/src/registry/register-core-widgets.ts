/**
 * Core Widget Registration
 *
 * Registers the 7 default widgets for the core field types.
 * Called during view engine initialization.
 */

import { registerWidgetIfAbsent } from "./widget-registry";
import { TextWidgetRender, TextWidgetReadonly, TextWidgetCell } from "../widgets/text-widget";
import {
  NumberWidgetRender,
  NumberWidgetReadonly,
  NumberWidgetCell,
} from "../widgets/number-widget";
import { MoneyWidgetRender, MoneyWidgetReadonly, MoneyWidgetCell } from "../widgets/money-widget";
import {
  BooleanWidgetRender,
  BooleanWidgetReadonly,
  BooleanWidgetCell,
} from "../widgets/boolean-widget";
import { DateWidgetRender, DateWidgetReadonly, DateWidgetCell } from "../widgets/date-widget";
import {
  SelectWidgetRender,
  SelectWidgetReadonly,
  SelectWidgetCell,
} from "../widgets/select-widget";
import {
  RelationWidgetRender,
  RelationWidgetReadonly,
  RelationWidgetCell,
} from "../widgets/relation-widget";

/**
 * Registers all core widgets.
 * Must be called before any widget resolution occurs.
 * Uses registerWidgetIfAbsent to allow ERP overrides to take precedence.
 */
export function registerCoreWidgets(): void {
  registerWidgetIfAbsent("text", {
    render: TextWidgetRender,
    readonly: TextWidgetReadonly,
    cell: TextWidgetCell,
  });

  registerWidgetIfAbsent("number", {
    render: NumberWidgetRender,
    readonly: NumberWidgetReadonly,
    cell: NumberWidgetCell,
  });

  registerWidgetIfAbsent("money", {
    render: MoneyWidgetRender,
    readonly: MoneyWidgetReadonly,
    cell: MoneyWidgetCell,
  });

  registerWidgetIfAbsent("boolean", {
    render: BooleanWidgetRender,
    readonly: BooleanWidgetReadonly,
    cell: BooleanWidgetCell,
  });

  registerWidgetIfAbsent("date", {
    render: DateWidgetRender,
    readonly: DateWidgetReadonly,
    cell: DateWidgetCell,
  });

  registerWidgetIfAbsent("select", {
    render: SelectWidgetRender,
    readonly: SelectWidgetReadonly,
    cell: SelectWidgetCell,
  });

  registerWidgetIfAbsent("relation", {
    render: RelationWidgetRender,
    readonly: RelationWidgetReadonly,
    cell: RelationWidgetCell,
  });
}
