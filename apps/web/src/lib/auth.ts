export interface Session {
  userId: number;
  tenantId: number;
  email: string;
  displayName: string;
}

export async function getSession(): Promise<Session | null> {
  return {
    userId: 1,
    tenantId: 1,
    email: "demo@afenda.com",
    displayName: "Demo User",
  };
}

export async function getUserPermissions(_userId: number, _tenantId: number): Promise<Set<string>> {
  return new Set(["*"]);
}
