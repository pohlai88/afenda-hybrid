/**
 * Metadata — Field Types
 *
 * Odoo-inspired field type union covering scalar values, dates, relations,
 * and selection fields. Apps map these to database column types; the UI
 * package only uses them to select the correct control.
 *
 * @version 1.0.0 — added LeanFieldType and UnifiedFieldType
 */

/** Scalar and composite field types (Odoo-style, verbose). */
export type FieldType =
  | "char"
  | "text"
  | "integer"
  | "float"
  | "monetary"
  | "boolean"
  | "date"
  | "datetime"
  | "selection"
  | "many2one"
  | "one2many"
  | "many2many"
  | "binary"
  | "html"
  | "reference";

/**
 * Lean field types — business-oriented vocabulary.
 * Simpler naming for new metadata definitions.
 */
export type LeanFieldType =
  | "text"
  | "number"
  | "money"
  | "boolean"
  | "date"
  | "select"
  | "relation";

/**
 * Unified field type — accepts both Odoo-style and lean vocabularies.
 * All metadata consumers must accept this union.
 */
export type UnifiedFieldType = FieldType | LeanFieldType;

/**
 * Normalizes a field type to the lean vocabulary.
 * Used internally by the view engine for consistent handling.
 */
export function normalizeFieldType(type: UnifiedFieldType): LeanFieldType {
  switch (type) {
    case "char":
    case "text":
    case "html":
      return "text";
    case "integer":
    case "float":
      return "number";
    case "monetary":
      return "money";
    case "boolean":
      return "boolean";
    case "date":
    case "datetime":
      return "date";
    case "selection":
      return "select";
    case "many2one":
    case "one2many":
    case "many2many":
    case "reference":
      return "relation";
    case "binary":
      return "text"; // fallback
    default:
      return type as LeanFieldType; // already lean
  }
}
