/**
 * Metadata — Model Definition
 *
 * A ModelDef groups all metadata for a single business entity: fields,
 * state machine, and default ordering. This is the top-level contract
 * that applications provide to the view engine.
 *
 * @version 1.0.0 — initial release
 */

import type { FieldDef } from "./field-def";

/**
 * State machine definition for workflow-driven models.
 * The state field must be a `select` type field in the model.
 */
export interface StateMachineDef {
  /** The field name that holds the current state value. */
  field: string;
  /** Ordered list of states in the workflow. */
  states: StateNode[];
}

/**
 * A single state in a workflow state machine.
 */
export interface StateNode {
  /** Stored value (must match one of the select field's options). */
  value: string;
  /** Human-readable label. */
  label: string;
  /**
   * If true, this state is "folded" (collapsed in Kanban view unless
   * it's the current state).
   */
  folded?: boolean;
  /**
   * Allowed target states for transitions. If omitted or empty, this
   * is a terminal state (no further transitions allowed).
   * Self-transitions are forbidden.
   */
  transitions?: string[];
}

/**
 * Complete definition of a business entity (model).
 * This is the root metadata contract provided by applications.
 */
export interface ModelDef {
  /** Metadata schema version. */
  version: 1;
  /** System identifier (immutable, e.g., "hr.employee"). */
  name: string;
  /** Human-readable label (e.g., "Employee"). */
  label: string;
  /** Map of field name to field definition. */
  fields: Record<string, FieldDef>;
  /** Optional state machine for workflow-driven models. */
  states?: StateMachineDef;
  /** Default sort order for list views. */
  defaultOrder?: Array<[field: string, direction: "asc" | "desc"]>;
}
