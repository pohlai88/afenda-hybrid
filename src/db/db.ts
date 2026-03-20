import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Migrations use quoted camelCase identifiers (e.g. "tenantId"); match that at runtime
export const db = drizzle(process.env.DATABASE_URL!, {
  schema,
  casing: "camelCase",
});

export type Database = typeof db;
