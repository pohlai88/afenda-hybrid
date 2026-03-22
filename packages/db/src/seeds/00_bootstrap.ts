import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Seed: Bootstrap (Tenant + System User + Currencies)
 *
 * Creates the foundational data needed before any other seeds can run:
 * 1. Default development tenant
 * 2. System user for audit trails
 * 3. ISO 4217 currencies (global reference data)
 *
 * This seed is special - it creates the tenant and user that other seeds depend on.
 * Run with: pnpm db:bootstrap
 */

const DEV_TENANT = {
  tenantCode: "DEV",
  name: "Development Tenant",
  settings: {
    theme: "system",
    locale: "en-US",
    timezone: "UTC",
    features: {
      hr: true,
      payroll: true,
      benefits: true,
      talent: true,
      learning: true,
      recruitment: true,
    },
  },
};

const SYSTEM_USER = {
  email: "system@afenda.com",
  displayName: "System",
  status: "ACTIVE",
};

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$", decimals: 2 },
  { code: "EUR", name: "Euro", symbol: "€", decimals: 2 },
  { code: "GBP", name: "British Pound", symbol: "£", decimals: 2 },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", decimals: 2 },
  { code: "SAR", name: "Saudi Riyal", symbol: "ر.س", decimals: 2 },
  { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق", decimals: 2 },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", decimals: 3 },
  { code: "BHD", name: "Bahraini Dinar", symbol: "د.ب", decimals: 3 },
  { code: "OMR", name: "Omani Rial", symbol: "ر.ع", decimals: 3 },
  { code: "EGP", name: "Egyptian Pound", symbol: "ج.م", decimals: 2 },
  { code: "JOD", name: "Jordanian Dinar", symbol: "د.أ", decimals: 3 },
  { code: "LBP", name: "Lebanese Pound", symbol: "ل.ل", decimals: 2 },
  { code: "INR", name: "Indian Rupee", symbol: "₹", decimals: 2 },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨", decimals: 2 },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", decimals: 2 },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", decimals: 0 },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", decimals: 2 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", decimals: 2 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", decimals: 2 },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", decimals: 2 },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", decimals: 2 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", decimals: 0 },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", decimals: 2 },
  { code: "KRW", name: "South Korean Won", symbol: "₩", decimals: 0 },
  { code: "ZAR", name: "South African Rand", symbol: "R", decimals: 2 },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", decimals: 2 },
  { code: "MXN", name: "Mexican Peso", symbol: "$", decimals: 2 },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", decimals: 2 },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", decimals: 2 },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", decimals: 2 },
];

export interface BootstrapResult {
  tenantId: number;
  systemUserId: number;
}

/**
 * Bootstrap the database with essential data.
 * Returns the tenant ID and system user ID for subsequent seeds.
 */
export async function seedBootstrap(): Promise<BootstrapResult> {
  console.log("\n🚀 Bootstrapping AFENDA database...\n");

  // 1. Create or get tenant
  const tenantResult = await db.execute<{ tenantId: number }>(sql`
    INSERT INTO core.tenants (
      "tenantCode", name, status, settings, "createdAt", "updatedAt"
    )
    VALUES (
      ${DEV_TENANT.tenantCode},
      ${DEV_TENANT.name},
      'ACTIVE',
      ${JSON.stringify(DEV_TENANT.settings)}::jsonb,
      now(),
      now()
    )
    ON CONFLICT (lower("tenantCode"))
    WHERE "deletedAt" IS NULL
    DO UPDATE SET
      name = EXCLUDED.name,
      settings = EXCLUDED.settings,
      "updatedAt" = now()
    RETURNING "tenantId"
  `);

  const tenantId = tenantResult.rows[0].tenantId;
  console.log(`✓ Tenant "${DEV_TENANT.tenantCode}" ready (ID: ${tenantId})`);

  // 2. Create or get system user (needs tenant for FK)
  const userResult = await db.execute<{ userId: number }>(sql`
    INSERT INTO security.users (
      "tenantId", email, "displayName", status, "emailVerified",
      "createdAt", "updatedAt", "createdBy", "updatedBy"
    )
    VALUES (
      ${tenantId},
      ${SYSTEM_USER.email},
      ${SYSTEM_USER.displayName},
      'ACTIVE'::"security"."user_status",
      true,
      now(),
      now(),
      1,
      1
    )
    ON CONFLICT ("tenantId", lower(email))
    WHERE "deletedAt" IS NULL
    DO UPDATE SET
      "displayName" = EXCLUDED."displayName",
      "updatedAt" = now()
    RETURNING "userId"
  `);

  const systemUserId = userResult.rows[0].userId;
  console.log(`✓ System user "${SYSTEM_USER.email}" ready (ID: ${systemUserId})`);

  // 3. Seed currencies (global, not tenant-scoped)
  for (const currency of CURRENCIES) {
    await db.execute(sql`
      INSERT INTO core.currencies (
        "currencyCode", name, symbol, "decimalPlaces", status,
        "createdAt", "updatedAt"
      )
      VALUES (
        ${currency.code},
        ${currency.name},
        ${currency.symbol},
        ${currency.decimals},
        'ACTIVE',
        now(),
        now()
      )
      ON CONFLICT (upper("currencyCode"))
      WHERE "deletedAt" IS NULL
      DO UPDATE SET
        name = EXCLUDED.name,
        symbol = EXCLUDED.symbol,
        "decimalPlaces" = EXCLUDED."decimalPlaces",
        "updatedAt" = now()
    `);
  }
  console.log(`✓ Seeded ${CURRENCIES.length} currencies`);

  console.log("\n✅ Bootstrap complete\n");

  return { tenantId, systemUserId };
}
