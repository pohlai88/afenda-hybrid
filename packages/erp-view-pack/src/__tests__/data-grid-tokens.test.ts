import { describe, expect, it } from "vitest";
import { dataGridRowSelectionClass } from "../selection/selection-tokens";
import {
  DATA_GRID_CELL_NUMERIC,
  DATA_GRID_CELL_STATUS,
  DATA_GRID_DENSITY_FINANCIAL,
  DATA_GRID_HEADER_STICKY,
  DATA_GRID_ROW_SURFACE,
} from "../selection/data-grid-tokens";

describe("data grid tokens (Data Grid Interaction Standard)", () => {
  it("aligns numeric cells right with tabular numerals", () => {
    expect(DATA_GRID_CELL_NUMERIC).toContain("text-right");
    expect(DATA_GRID_CELL_NUMERIC).toContain("tabular-nums");
  });

  it("centers status cells", () => {
    expect(DATA_GRID_CELL_STATUS).toBe("text-center");
  });

  it("financial density uses tabular numerals", () => {
    expect(DATA_GRID_DENSITY_FINANCIAL).toContain("tabular-nums");
  });

  it("sticky header uses sticky positioning", () => {
    expect(DATA_GRID_HEADER_STICKY).toContain("sticky");
    expect(DATA_GRID_HEADER_STICKY).toContain("top-0");
  });

  it("keeps row surface in sync with legacy export", () => {
    expect(dataGridRowSelectionClass).toBe(DATA_GRID_ROW_SURFACE);
  });
});
