/**
 * Metadata — View Kinds
 *
 * Canonical view types for AFENDA. Limited to 3 core views that map to
 * how humans operate: scan (list), inspect (form), track process (kanban).
 *
 * @version 1.0.0 — narrowed to 3 canonical views, added LayoutNode
 */

import type { LayoutNode } from "./layout";
import type { Condition } from "./condition";

/**
 * Supported view rendering modes.
 * Narrowed from 5 to 3 canonical views per SPEC.md.
 */
export type ViewKind = "list" | "form" | "kanban";

/**
 * Filter expression — uses the same operator grammar as Condition.
 */
export type FilterExpr = Condition;

/**
 * Describes a view definition that apps can register or serve from an API.
 * Versioned for forward compatibility.
 */
export interface ViewDef {
  /** Metadata schema version. */
  version: 1;

  /** Unique identifier for this view (e.g. `"hr.employee.list"`). */
  id: string;

  /** Human-readable name. */
  name: string;

  /** View type. */
  kind: ViewKind;

  /** The model this view belongs to (e.g. `"hr.employee"`). */
  model: string;

  /**
   * Ordered list of field names to include in this view.
   * Used by list and kanban views.
   */
  fields?: string[];

  /**
   * Layout tree for form views.
   * Defines spatial arrangement of fields, groups, notebooks, and separators.
   */
  layout?: LayoutNode[];

  /** Filter expressions for this view. */
  filters?: FilterExpr[];

  /** Default sort order (`[fieldName, "asc" | "desc"]` tuples). */
  defaultOrder?: Array<[field: string, direction: "asc" | "desc"]>;

  /** Fields available as quick-filter facets in list views. */
  searchFields?: string[];
}
