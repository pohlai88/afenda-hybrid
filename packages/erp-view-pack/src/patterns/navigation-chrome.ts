/**
 * Conformance identifiers for cross-module navigation UI.
 *
 * @see `../../../../docs/patterns/cross-module-navigation-standard.md` §6, §8–9
 */

export const NAVIGATION_SURFACE_ATTR = "data-afenda-nav-surface" as const;

/** Primary sidebar / rail container. */
export const NAVIGATION_SURFACE_SIDEBAR_RAIL = "sidebar-rail" as const;

/** One application module section (header + its menu list). */
export const NAVIGATION_SURFACE_MODULE_GROUP = "module-group" as const;

/** Currently active route item within the tree. */
export const NAVIGATION_SURFACE_MENU_ITEM_ACTIVE = "menu-item-active" as const;

export type NavigationSurfaceRole =
  | typeof NAVIGATION_SURFACE_SIDEBAR_RAIL
  | typeof NAVIGATION_SURFACE_MODULE_GROUP
  | typeof NAVIGATION_SURFACE_MENU_ITEM_ACTIVE;

export function navigationSurfaceDataAttrs(role: NavigationSurfaceRole) {
  return { [NAVIGATION_SURFACE_ATTR]: role } as Record<
    typeof NAVIGATION_SURFACE_ATTR,
    NavigationSurfaceRole
  >;
}
