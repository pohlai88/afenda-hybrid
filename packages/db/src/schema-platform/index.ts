export * from "./core";
export * from "./security";
export * from "./audit";
/** HRM domains live in `schema-hrm/` (sibling package) for clearer boundaries vs core/security/audit. */
export * from "../schema-hrm/hr";
export * from "../schema-hrm/payroll";
export * from "../schema-hrm/benefits";
export * from "../schema-hrm/talent";
export * from "../schema-hrm/learning";
export * from "../schema-hrm/recruitment";

// Session / connection helpers (not Drizzle table modules)
export { setSessionContext, clearSessionContext, type SessionContext } from "../_session";
