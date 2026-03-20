import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Prefer values from `.env` over inherited shell/system env so local URLs match the file.
config({ override: true });

export default defineConfig({
  dialect: "postgresql",
  // Single entry avoids duplicate table/enum registration (glob would also load index.ts barrels).
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  schemaFilter: ["core", "security", "audit", "hr", "payroll", "benefits", "talent", "learning", "recruitment"],
  entities: {
    roles: true,
  },
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
