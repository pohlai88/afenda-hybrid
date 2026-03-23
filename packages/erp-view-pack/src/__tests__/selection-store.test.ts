import { describe, expect, it } from "vitest";
import { createSelectionStore, selectSelectionCount } from "../selection/selection-store";
import { reconcileSelectionIds } from "../selection/reconcile-selection-ids";

describe("createSelectionStore", () => {
  it("toggles one id", () => {
    const store = createSelectionStore();
    store.getState().toggleOne("a");
    expect(store.getState().selectedIds.has("a")).toBe(true);
    store.getState().toggleOne("a");
    expect(store.getState().selectedIds.has("a")).toBe(false);
  });

  it("toggles full page", () => {
    const store = createSelectionStore();
    const page = ["a", "b", "c"];
    store.getState().togglePage(page);
    expect(page.every((id) => store.getState().selectedIds.has(id))).toBe(true);
    store.getState().togglePage(page);
    expect(store.getState().selectedIds.size).toBe(0);
  });

  it("clears selection when filter context changes", () => {
    const store = createSelectionStore();
    store.getState().setFilterContext("h1");
    store.getState().toggleOne("x");
    expect(store.getState().selectedIds.size).toBe(1);
    store.getState().setFilterContext("h2");
    expect(store.getState().selectedIds.size).toBe(0);
    expect(store.getState().filterHash).toBe("h2");
  });

  it("reconciles explicit ids to valid set", () => {
    const store = createSelectionStore();
    store.getState().replaceSelectedIds(["a", "b", "gone"]);
    store.getState().reconcileToValidIds(new Set(["a", "b"]));
    expect([...store.getState().selectedIds].sort()).toEqual(["a", "b"]);
  });

  it("enterFilteredVirtual reports count and selects all visible page ids logically", () => {
    const store = createSelectionStore();
    store.getState().enterFilteredVirtual(248);
    expect(selectSelectionCount(store.getState())).toBe(248);
    const page = ["r1", "r2"];
    expect(store.getState().isAllPageSelected(page)).toBe(true);
    expect(store.getState().isSomePageSelected(page)).toBe(false);
    store.getState().toggleOne("r1", page);
    expect(store.getState().bulkScope).toBe("none");
    expect(store.getState().selectedIds.has("r2")).toBe(true);
    expect(store.getState().selectedIds.has("r1")).toBe(false);
  });

  it("header toggle from virtual demotes to explicit page selection", () => {
    const store = createSelectionStore();
    store.getState().enterFilteredVirtual(100);
    const page = ["a", "b"];
    store.getState().togglePage(page);
    expect(store.getState().bulkScope).toBe("none");
    expect(store.getState().isAllPageSelected(page)).toBe(true);
  });
});

describe("reconcileSelectionIds", () => {
  it("drops stale ids", () => {
    const next = reconcileSelectionIds(new Set(["a", "b"]), new Set(["b", "c"]));
    expect([...next]).toEqual(["b"]);
  });
});
