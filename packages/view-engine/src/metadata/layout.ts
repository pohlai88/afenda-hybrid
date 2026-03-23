/**
 * Metadata — Layout Tree
 *
 * Typed layout tree for form views with structural constraints that
 * prevent unusable enterprise screens.
 *
 * @version 1.0.0 — initial release
 */

import type { ModelDef } from "./model-def";

/**
 * A field node references a single field from the model.
 */
export interface FieldNode {
  kind: "field";
  /** Field name (must exist in ModelDef.fields). */
  name: string;
  /** Column span (1-3, only valid in horizontal groups). */
  colspan?: 1 | 2 | 3;
}

/**
 * A group node contains multiple child nodes arranged vertically or horizontally.
 */
export interface GroupNode {
  kind: "group";
  /** Layout direction. */
  direction: "vertical" | "horizontal";
  /** Optional group heading. */
  title?: string;
  /** Number of columns for child fields (1-3). */
  columns?: 1 | 2 | 3;
  /** Child nodes. */
  children: LayoutNode[];
}

/**
 * A notebook node creates a tabbed interface with multiple pages.
 */
export interface NotebookNode {
  kind: "notebook";
  /** Tab pages. */
  pages: Array<{
    /** Unique key for this page. */
    key: string;
    /** Tab label. */
    label: string;
    /** Page content. */
    children: LayoutNode[];
    /** Optional condition to hide this page. */
    invisible?: import("./condition").Condition;
  }>;
}

/**
 * A separator node creates a visual divider.
 */
export interface SeparatorNode {
  kind: "separator";
  /** Optional label for the separator. */
  label?: string;
}

/**
 * A layout node is one of four types: field, group, notebook, or separator.
 */
export type LayoutNode = FieldNode | GroupNode | NotebookNode | SeparatorNode;

// ---------------------------------------------------------------------------
// Layout Validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface ValidationContext {
  model: ModelDef;
  depth: number;
  notebookDepth: number;
  errors: string[];
}

/**
 * Validates a layout tree against the structural constraints defined in SPEC.md.
 *
 * **Constraints enforced:**
 * - Group nesting depth ≤ 4
 * - Notebook nesting ≤ 1 (no nested notebooks)
 * - Total tree depth ≤ 6
 * - Horizontal groups ≤ 3 fields
 * - Notebook pages ≤ 6
 * - Pages must contain ≥ 1 field
 * - Separator cannot be first or last in group
 * - Field colspan: 1, 2, or 3 only
 * - All field names must exist in ModelDef.fields
 *
 * @param nodes - The layout tree to validate
 * @param model - The model definition (for field name validation)
 * @returns Validation result with structured errors
 */
export function validateLayout(nodes: LayoutNode[], model: ModelDef): ValidationResult {
  const ctx: ValidationContext = {
    model,
    depth: 0,
    notebookDepth: 0,
    errors: [],
  };

  validateNodes(nodes, ctx, null);

  return {
    valid: ctx.errors.length === 0,
    errors: ctx.errors,
  };
}

function validateNodes(
  nodes: LayoutNode[],
  ctx: ValidationContext,
  parent: "group" | "notebook" | null
): void {
  if (nodes.length === 0) return;

  // Check separator position constraints
  if (parent === "group") {
    const firstNode = nodes[0];
    const lastNode = nodes[nodes.length - 1];

    if (firstNode?.kind === "separator") {
      ctx.errors.push("Separator cannot be the first element in a group");
    }
    if (lastNode?.kind === "separator") {
      ctx.errors.push("Separator cannot be the last element in a group");
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    validateNode(node, ctx, i);
  }
}

function validateNode(node: LayoutNode, ctx: ValidationContext, index: number): void {
  // Check total depth
  if (ctx.depth > 6) {
    ctx.errors.push(`Total tree depth exceeds maximum of 6 at node ${index}`);
    return;
  }

  switch (node.kind) {
    case "field":
      validateFieldNode(node, ctx, index);
      break;
    case "group":
      validateGroupNode(node, ctx, index);
      break;
    case "notebook":
      validateNotebookNode(node, ctx, index);
      break;
    case "separator":
      // Separator position is checked in validateNodes
      break;
  }
}

function validateFieldNode(node: FieldNode, ctx: ValidationContext, index: number): void {
  // Field must exist in model
  if (!ctx.model.fields[node.name]) {
    ctx.errors.push(`Unknown field "${node.name}" at node ${index}`);
  }

  // Colspan validation
  if (node.colspan !== undefined) {
    if (node.colspan < 1 || node.colspan > 3) {
      ctx.errors.push(
        `Invalid colspan ${node.colspan} for field "${node.name}" (must be 1, 2, or 3)`
      );
    }
  }
}

function validateGroupNode(node: GroupNode, ctx: ValidationContext, index: number): void {
  // Check group nesting depth
  if (ctx.depth >= 4) {
    ctx.errors.push(`Group nesting depth exceeds maximum of 4 at node ${index}`);
    return;
  }

  // Groups must have at least 1 child
  if (node.children.length === 0) {
    ctx.errors.push(`Group at node ${index} has no children`);
    return;
  }

  // Horizontal groups: max 3 fields
  if (node.direction === "horizontal") {
    const fieldCount = node.children.filter((c) => c.kind === "field").length;
    if (fieldCount > 3) {
      ctx.errors.push(`Horizontal group at node ${index} has ${fieldCount} fields (max 3 allowed)`);
    }
  }

  // Recurse with incremented depth
  const childCtx: ValidationContext = { ...ctx, depth: ctx.depth + 1 };
  validateNodes(node.children, childCtx, "group");
  ctx.errors.push(...childCtx.errors);
}

function validateNotebookNode(node: NotebookNode, ctx: ValidationContext, index: number): void {
  // Check notebook nesting depth
  if (ctx.notebookDepth >= 1) {
    ctx.errors.push(`Nested notebooks are forbidden at node ${index}`);
    return;
  }

  // Max 6 pages
  if (node.pages.length > 6) {
    ctx.errors.push(`Notebook at node ${index} has ${node.pages.length} pages (max 6 allowed)`);
  }

  // Each page must have at least 1 field
  for (let i = 0; i < node.pages.length; i++) {
    const page = node.pages[i]!;
    if (page.children.length === 0) {
      ctx.errors.push(`Notebook page "${page.label}" at node ${index} has no children`);
    }

    // Check for notebooks inside pages
    const hasNestedNotebook = page.children.some((c) => c.kind === "notebook");
    if (hasNestedNotebook) {
      ctx.errors.push(`Notebook page "${page.label}" contains a nested notebook (forbidden)`);
    }
  }

  // Recurse with incremented notebook depth
  const childCtx: ValidationContext = {
    ...ctx,
    depth: ctx.depth + 1,
    notebookDepth: ctx.notebookDepth + 1,
  };

  for (const page of node.pages) {
    validateNodes(page.children, childCtx, "notebook");
  }

  ctx.errors.push(...childCtx.errors);
}
