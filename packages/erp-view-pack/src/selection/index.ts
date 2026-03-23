/**
 * Grid selection **UI state** (ids, page vs filter scope) for use with metadata-driven collection views.
 * Does not replace **permission contracts** — row/action eligibility is resolved in the interpretation layer.
 *
 * @see `../../../../docs/patterns/metadata-driven-view-composition-standard.md` §5.1
 * @see `../../../../docs/patterns/permission-role-interaction-standard.md` §7
 */

export {
  createSelectionStore,
  selectSelectionCount,
  type SelectionBulkScope,
  type SelectionStore,
  type SelectionStoreActions,
  type SelectionStoreState,
} from "./selection-store";
export { selectionScopeCount, type SelectionScope } from "./selection-scope";
export {
  bulkSelectionScopeSrOnlyLabel,
  type BulkSelectionScopeUi,
} from "./bulk-selection-scope-ui";
export { useEscapeClearsSelection } from "./use-escape-clears-selection";
export {
  SelectionStoreProvider,
  useSelectionStore,
  type SelectionStoreProviderProps,
} from "./selection-store-context";
export { reconcileSelectionIds } from "./reconcile-selection-ids";
export {
  SELECTION_BAR_SURFACE,
  SELECTION_CHECKBOX_MOTION,
  SELECTION_COLUMN_CELL_CLASS,
  SELECTION_COLUMN_CLASS,
  SELECTION_EXEC_TEXT,
  dataGridRowSelectionClass,
} from "./selection-tokens";
export {
  DATA_GRID_CELL_ATTRIBUTE,
  DATA_GRID_CELL_NUMERIC,
  DATA_GRID_CELL_PRIMARY,
  DATA_GRID_CELL_STATUS,
  DATA_GRID_CELL_TEXT,
  DATA_GRID_DENSITY_COMFORTABLE,
  DATA_GRID_DENSITY_COMPACT,
  DATA_GRID_DENSITY_FINANCIAL,
  DATA_GRID_HEADER_STICKY,
  DATA_GRID_ROW_CLICKABLE,
  DATA_GRID_ROW_SURFACE,
} from "./data-grid-tokens";
export { SelectAllCheckbox, type SelectAllCheckboxProps } from "./select-all-checkbox";
export { RowCheckbox, type RowCheckboxProps } from "./row-checkbox";
