import { describe, expect, it } from "vitest";
import {
  NAVIGATION_SURFACE_ATTR,
  NAVIGATION_SURFACE_MENU_ITEM_ACTIVE,
  NAVIGATION_SURFACE_MODULE_GROUP,
  NAVIGATION_SURFACE_SIDEBAR_RAIL,
  navigationSurfaceDataAttrs,
} from "../patterns/navigation-chrome";

describe("navigation-chrome", () => {
  it("navigationSurfaceDataAttrs sets the conformance attribute", () => {
    expect(navigationSurfaceDataAttrs(NAVIGATION_SURFACE_SIDEBAR_RAIL)).toEqual({
      [NAVIGATION_SURFACE_ATTR]: NAVIGATION_SURFACE_SIDEBAR_RAIL,
    });
    expect(navigationSurfaceDataAttrs(NAVIGATION_SURFACE_MODULE_GROUP)).toEqual({
      [NAVIGATION_SURFACE_ATTR]: NAVIGATION_SURFACE_MODULE_GROUP,
    });
    expect(navigationSurfaceDataAttrs(NAVIGATION_SURFACE_MENU_ITEM_ACTIVE)).toEqual({
      [NAVIGATION_SURFACE_ATTR]: NAVIGATION_SURFACE_MENU_ITEM_ACTIVE,
    });
  });
});
