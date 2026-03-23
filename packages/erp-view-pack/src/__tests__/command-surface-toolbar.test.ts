import { describe, expect, it } from "vitest";
import {
  COMMAND_SURFACE_ATTR,
  COMMAND_SURFACE_BULK_SELECTION,
  COMMAND_SURFACE_SELECTION_NOTICE,
  COMMAND_SURFACE_ZONE_DIVIDER,
  commandSurfaceDataAttrs,
} from "../patterns/command-surface-toolbar";

describe("command-surface-toolbar", () => {
  it("commandSurfaceDataAttrs sets the conformance attribute", () => {
    expect(commandSurfaceDataAttrs(COMMAND_SURFACE_BULK_SELECTION)).toEqual({
      [COMMAND_SURFACE_ATTR]: COMMAND_SURFACE_BULK_SELECTION,
    });
    expect(commandSurfaceDataAttrs(COMMAND_SURFACE_SELECTION_NOTICE)).toEqual({
      [COMMAND_SURFACE_ATTR]: COMMAND_SURFACE_SELECTION_NOTICE,
    });
  });

  it("zone divider matches action-bar chrome token", () => {
    expect(COMMAND_SURFACE_ZONE_DIVIDER).toContain("bg-border");
    expect(COMMAND_SURFACE_ZONE_DIVIDER).toContain("w-px");
  });
});
