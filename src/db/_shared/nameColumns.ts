import { text } from "drizzle-orm/pg-core";

/**
 * Shared semantic name column.
 *
 * Promote repeated `name: text().notNull()` definitions into a single mixin
 * so cross-schema naming semantics stay consistent.
 */
export const nameColumn = {
  name: text().notNull(),
} as const;

export const NAME_FINGERPRINTS = {
  name: "text:notNull",
} as const;
