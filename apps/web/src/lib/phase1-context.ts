/** Phase 1 session stubs — replace with real auth/session (plan Phase 2). */
export const PHASE1_TENANT_ID = Number(
  process.env.AFENDA_TENANT_ID ?? process.env.NEXT_PUBLIC_AFENDA_TENANT_ID ?? "1"
);

export const PHASE1_USER_ID = Number(
  process.env.AFENDA_USER_ID ?? process.env.NEXT_PUBLIC_AFENDA_USER_ID ?? "1"
);
