/**
 * Session snapshot for the dashboard shell (plan §4c).
 * Phase 2: replace with real auth (cookies / session store).
 */
export interface DashboardSession {
  ok: true;
}

export async function loadSession(): Promise<DashboardSession> {
  return { ok: true };
}
