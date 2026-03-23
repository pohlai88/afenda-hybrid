/**
 * Command surface & toolbar tokens and identifiers for bulk selection UI.
 *
 * @see `../../../../docs/patterns/command-surface-toolbar-standard.md`
 */

export const COMMAND_SURFACE_ATTR = "data-afenda-command-surface" as const;

/** Floating, sticky, and compact bulk selection bars (Standard §7). */
export const COMMAND_SURFACE_BULK_SELECTION = "bulk-selection-toolbar" as const;

/** Gmail / Notion-style escalation strip (Standard §4). */
export const COMMAND_SURFACE_SELECTION_NOTICE = "bulk-selection-notice" as const;

export type CommandSurfaceBulkRole =
  | typeof COMMAND_SURFACE_BULK_SELECTION
  | typeof COMMAND_SURFACE_SELECTION_NOTICE;

/** Props fragment for root elements (`data-afenda-command-surface`). */
export function commandSurfaceDataAttrs(role: CommandSurfaceBulkRole) {
  return { [COMMAND_SURFACE_ATTR]: role } as Record<
    typeof COMMAND_SURFACE_ATTR,
    CommandSurfaceBulkRole
  >;
}

export {
  ACTION_BAR_ACTIONS_SCROLL as COMMAND_SURFACE_ACTION_SCROLL,
  ACTION_BAR_COMPACT_CHILD_HIT as COMMAND_SURFACE_COMPACT_ACTION_HIT,
  ACTION_BAR_DESTRUCTIVE as COMMAND_SURFACE_DESTRUCTIVE_CHROME,
  ACTION_BAR_DIVIDER as COMMAND_SURFACE_ZONE_DIVIDER,
  ACTION_BAR_DIVIDER_COMPACT as COMMAND_SURFACE_ZONE_DIVIDER_COMPACT,
  ACTION_BAR_ROOT_MOTION as COMMAND_SURFACE_TOOLBAR_MOTION,
} from "./action-bar-chrome";
