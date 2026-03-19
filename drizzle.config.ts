import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load environment variables from .env file
config();

export default defineConfig({
  dialect: "postgresql",
  // Single entry avoids duplicate table/enum registration (glob would also load index.ts barrels).
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  schemaFilter: ["core", "security", "audit", "hr", "finance"],
  entities: {
    roles: true,
  },
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
