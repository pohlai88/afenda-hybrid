import { createStore } from "zustand/vanilla";
import type { StoreApi } from "zustand/vanilla";

/**
 * Edge-case matrix (expected handling), aligned with
 * `docs/patterns/data-grid-interaction-standard.md` §4–6 and
 * `docs/patterns/bulk-interaction-standard.md` §7:
 *
 * | Scenario            | Handling |
 * |---------------------|----------|
 * | Filter changes      | `setFilterContext` clears selection + resets virtual bulk |
 * | Page changes        | `selectedIds` persists (server-safe row IDs) |
 * | Server refresh      | Same + `reconcileToValidIds` drops removed rows |
 * | Virtual bulk        | `enterFilteredVirtual` / `enterAllVirtual`; row uncheck passes `pageIds` to demote |
 * | Partial page load   | `togglePage` only touches known `pageIds` |
 */

/**
 * Bulk scope without materializing IDs (large filtered / full datasets).
 * - `none` — only {@link SelectionStoreState.selectedIds} counts.
 * - `filtered` — treat “all rows matching current filter” as selected ({@link SelectionStoreState.filteredVirtualTotal}).
 * - `all` — entire dataset ({@link SelectionStoreState.allVirtualTotal}).
 */
export type SelectionBulkScope = "none" | "filtered" | "all";

export interface SelectionStoreState {
  selectedIds: Set<string>;
  bulkScope: SelectionBulkScope;
  /** When `bulkScope === "filtered"`, reported selection count. */
  filteredVirtualTotal: number | null;
  /** When `bulkScope === "all"`, reported selection count. */
  allVirtualTotal: number | null;
  /** Fingerprint of active filters; change should clear selection (see {@link SelectionStoreState.setFilterContext}). */
  filterHash: string | null;
}

export interface SelectionStoreActions {
  toggleOne: (id: string, currentPageIds?: readonly string[]) => void;
  togglePage: (pageIds: readonly string[]) => void;
  clear: () => void;
  setFilterContext: (hash: string | null) => void;
  /** Replace explicit selection (e.g. server returned all page IDs). Resets virtual bulk. */
  replaceSelectedIds: (ids: readonly string[]) => void;
  /** Drop IDs that no longer exist after refetch (soft delete, stale rows). No-op for virtual bulk. */
  reconcileToValidIds: (validIds: ReadonlySet<string>) => void;
  /** “Select all matching filter” without loading every ID. */
  enterFilteredVirtual: (total: number) => void;
  /** Select entire dataset (use with server-side guards). */
  enterAllVirtual: (total: number) => void;

  getSelectionCount: () => number;
  isIdSelected: (id: string, pageIds?: readonly string[]) => boolean;
  isAllPageSelected: (pageIds: readonly string[]) => boolean;
  isSomePageSelected: (pageIds: readonly string[]) => boolean;
}

export type SelectionStore = StoreApi<SelectionStoreState & SelectionStoreActions>;

const initialState: SelectionStoreState = {
  selectedIds: new Set(),
  bulkScope: "none",
  filteredVirtualTotal: null,
  allVirtualTotal: null,
  filterHash: null,
};

/** Use with `useStore` selectors for a stable derived count. */
export function selectSelectionCount(s: SelectionStoreState & SelectionStoreActions): number {
  if (s.bulkScope === "filtered") return s.filteredVirtualTotal ?? 0;
  if (s.bulkScope === "all") return s.allVirtualTotal ?? 0;
  return s.selectedIds.size;
}

/**
 * Zustand vanilla store factory — one instance per {@link SelectionStoreProvider}, or use standalone for tests.
 *
 * Edge cases (filter change, pagination, refetch, virtual bulk) are documented on actions.
 */
export function createSelectionStore(): SelectionStore {
  return createStore<SelectionStoreState & SelectionStoreActions>((set, get) => ({
    ...initialState,

    toggleOne: (id, currentPageIds) => {
      const state = get();
      if (state.bulkScope === "filtered" || state.bulkScope === "all") {
        if (!currentPageIds?.length) return;
        const next = new Set(currentPageIds);
        next.delete(id);
        set({
          bulkScope: "none",
          selectedIds: next,
          filteredVirtualTotal: null,
          allVirtualTotal: null,
        });
        return;
      }
      set((prev) => {
        const next = new Set(prev.selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { selectedIds: next, bulkScope: "none" };
      });
    },

    togglePage: (pageIds) => {
      set((state) => {
        if (state.bulkScope === "filtered" || state.bulkScope === "all") {
          return {
            bulkScope: "none",
            selectedIds: new Set(pageIds),
            filteredVirtualTotal: null,
            allVirtualTotal: null,
          };
        }
        const next = new Set(state.selectedIds);
        const allOnPage = pageIds.length > 0 && pageIds.every((id) => next.has(id));
        for (const id of pageIds) {
          if (allOnPage) next.delete(id);
          else next.add(id);
        }
        return { selectedIds: next };
      });
    },

    clear: () => set({ ...initialState }),

    setFilterContext: (hash) => {
      const prev = get().filterHash;
      if (prev === hash) {
        set({ filterHash: hash });
        return;
      }
      set({
        filterHash: hash,
        selectedIds: new Set(),
        bulkScope: "none",
        filteredVirtualTotal: null,
        allVirtualTotal: null,
      });
    },

    replaceSelectedIds: (ids) =>
      set({
        selectedIds: new Set(ids),
        bulkScope: "none",
        filteredVirtualTotal: null,
        allVirtualTotal: null,
      }),

    reconcileToValidIds: (validIds) => {
      const state = get();
      if (state.bulkScope !== "none") return;
      set((prev) => {
        const next = new Set<string>();
        for (const id of prev.selectedIds) {
          if (validIds.has(id)) next.add(id);
        }
        return { selectedIds: next };
      });
    },

    enterFilteredVirtual: (total) =>
      set({
        selectedIds: new Set(),
        bulkScope: "filtered",
        filteredVirtualTotal: total,
        allVirtualTotal: null,
      }),

    enterAllVirtual: (total) =>
      set({
        selectedIds: new Set(),
        bulkScope: "all",
        filteredVirtualTotal: null,
        allVirtualTotal: total,
      }),

    getSelectionCount: () => selectSelectionCount(get()),

    isIdSelected: (id, pageIds) => {
      const s = get();
      if (s.bulkScope === "filtered") {
        if (!pageIds?.length) return false;
        return pageIds.includes(id);
      }
      if (s.bulkScope === "all") {
        if (!pageIds?.length) return true;
        return pageIds.includes(id);
      }
      return s.selectedIds.has(id);
    },

    isAllPageSelected: (pageIds) => {
      const s = get();
      if (pageIds.length === 0) return false;
      if (s.bulkScope === "filtered" || s.bulkScope === "all") {
        return pageIds.every((id) => get().isIdSelected(id, pageIds));
      }
      return pageIds.every((id) => s.selectedIds.has(id));
    },

    isSomePageSelected: (pageIds) => {
      const s = get();
      if (pageIds.length === 0) return false;
      if (s.bulkScope === "filtered" || s.bulkScope === "all") return false;
      const all = pageIds.every((id) => s.selectedIds.has(id));
      if (all) return false;
      return pageIds.some((id) => s.selectedIds.has(id));
    },
  }));
}
