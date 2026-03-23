"use client";

import * as React from "react";
import { useStore } from "zustand/react";
import { createSelectionStore, type SelectionStore } from "./selection-store";

const SelectionStoreContext = React.createContext<SelectionStore | null>(null);

export interface SelectionStoreProviderProps {
  children: React.ReactNode;
}

/**
 * One store per provider (e.g. wrap a single DataGrid). Nests create independent stores.
 */
export function SelectionStoreProvider({ children }: SelectionStoreProviderProps) {
  const ref = React.useRef<SelectionStore | null>(null);
  if (!ref.current) {
    ref.current = createSelectionStore();
  }
  return (
    <SelectionStoreContext.Provider value={ref.current}>{children}</SelectionStoreContext.Provider>
  );
}

export function useSelectionStore<T>(
  selector: (state: ReturnType<SelectionStore["getState"]>) => T
): T {
  const store = React.useContext(SelectionStoreContext);
  if (!store) {
    throw new Error("useSelectionStore must be used within SelectionStoreProvider");
  }
  return useStore(store, selector);
}
