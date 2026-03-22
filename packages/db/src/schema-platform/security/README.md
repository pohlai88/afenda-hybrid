# Security schema (`security`)

PostgreSQL schema `security`: interactive **users**, **roles**, **user–role assignments**, and **service principals** (machine identities). All tenant-scoped tables reference `core.tenants`.

**Tables (Drizzle / Postgres):** `users`, `roles`, `user_roles`, `service_principals`, `permissions`, `policies`, `user_preferences`, `user_sessions`. Role capability is modeled via `roles.permissions` JSON plus normalized `permissions` and rule rows in `policies` (no separate junction tables for per-role or per-user permission tuples).

## Layout

| File                   | Role                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `users.ts`             | `pgSchema("security")`, table `users`, `user_status` enum                                |
| `roles.ts`             | Table `roles`, JSON `permissions`                                                        |
| `userRoles.ts`         | Table `user_roles` — assignments `(userId, roleId)` + `assignedBy`, optional `expiresAt` |
| `servicePrincipals.ts` | Table `service_principals` — OAuth/client-style principals, `clientId` UUID              |
| `permissions.ts`       | Table `permissions` — resource/action/key tuples for RBAC                                |
| `policies.ts`          | Table `policies` — JSONB rules, priority, effect (ABAC-style)                            |
| `userPreferences.ts`   | Table `user_preferences` — per-user settings                                             |
| `userSessions.ts`      | Table `user_sessions` — session metadata                                                 |
| `_relations.ts`        | Single `defineRelations()` graph for this domain                                         |
| `index.ts`             | Barrel exports                                                                           |

## Conventions

1. **Relations** — Only `_relations.ts` defines `defineRelations()` for security. [`db.ts`](../../db.ts) merges `securityRelations` with other domains (e.g. `benefitsRelations`) so `db.query.*` covers the combined graph.

2. **Enums** — Each PG enum has a `const` array (`as const`), `securitySchema.enum(...)`, and **`XxxSchema = z.enum(thatArray)`** plus **`export type Xxx = z.infer<typeof XxxSchema>`**. Insert/update schemas override enum columns with these Zod enums (not `createSelectSchema(pgEnum)`).

3. **Defaults** — Columns with DB defaults use **`.optional()`** on insert Zod (e.g. `status`, `isSystemRole`) so callers may omit them.

4. **Audit** — Tables with `auditColumns` require **`createdBy` / `updatedBy`** at the database level; the API or service layer must set them (same as recruitment).

5. **Tenancy** — Every table includes `tenantId` + FK to `core.tenants`. Cross-row tenant consistency (e.g. `user_roles.tenantId` vs `users.tenantId`) is enforced in application or trigger logic where needed.

6. **IDs** — Insert schemas use **`z.number().int().positive()`** for `tenantId` and audit user ids where applicable. **Composite / branded** id helpers (`UserIdSchema`, `RoleIdSchema`, etc.) are for typing at boundaries.

7. **Assignments** — Prefer **`userRoleAssignmentInsertSchema`** for grants (positive FKs, `assignedBy` message, `expiresAt` rules). **`userRoleInsertSchema`** remains the raw Drizzle-generated shape.

## Related code

- DB entry: [`db.ts`](../../db.ts) (schema + `securityRelations`)
- Zod / contract tests: `__tests__/users-zod.test.ts`, `roles-zod.test.ts`, `user-roles-zod.test.ts`, `service-principals-*.test.ts`, `user-roles-assigned-by-relation.test.ts`
- Core relations that reference security entities: [`core/_relations.ts`](../core/_relations.ts)
