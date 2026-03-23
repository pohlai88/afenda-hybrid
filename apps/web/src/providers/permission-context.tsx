"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { eligibilityForModel, type UserEligibility } from "@/lib/metadata/permission-utils";

const PermissionContext = createContext<readonly string[] | null>(null);

export function PermissionProvider({
  keys,
  children,
}: {
  keys: readonly string[];
  children: ReactNode;
}) {
  return <PermissionContext.Provider value={keys}>{children}</PermissionContext.Provider>;
}

export function usePermissionKeys(): Set<string> {
  const keys = useContext(PermissionContext);
  if (!keys) {
    throw new Error("usePermissionKeys must be used within PermissionProvider");
  }
  return useMemo(() => new Set(keys), [keys]);
}

export function useEligibilityForModel(modelName: string): UserEligibility {
  const keySet = usePermissionKeys();
  return useMemo(() => eligibilityForModel(keySet, modelName), [keySet, modelName]);
}
