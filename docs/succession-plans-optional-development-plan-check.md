# Optional: require `developmentPlan` for live succession plans

**Status:** Not applied in the codebase. Use when product mandates a written development plan for any plan in **`ACTIVE`** or **`UNDER_REVIEW`**.

Existing enforcement (already shipped): `chk_succession_plans_target_when_live` — `targetDate` required for those statuses.

---

## CHECK constraint (PostgreSQL)

Name: `chk_succession_plans_development_when_live`

```sql
ALTER TABLE "talent"."succession_plans"
  ADD CONSTRAINT "chk_succession_plans_development_when_live" CHECK (
    "status"::text NOT IN ('ACTIVE', 'UNDER_REVIEW')
    OR (
      "developmentPlan" IS NOT NULL
      AND length(trim("developmentPlan")) > 0
    )
  );
```

Notes:

- **`trim` + length** treats whitespace-only plans as empty. Drop `trim` if a single space should count as “present.”
- **`varchar(4000)`** already caps length; no change needed there.

---

## Drizzle schema (when you enable it)

In `successionPlans.ts`, add alongside other `check()` entries:

```ts
check(
  "chk_succession_plans_development_when_live",
  sql`(${t.status}::text NOT IN ('ACTIVE', 'UNDER_REVIEW')) OR (
    ${t.developmentPlan} IS NOT NULL AND length(trim(${t.developmentPlan})) > 0
  )`
),
```

Generate or hand-write a migration that only runs `ADD CONSTRAINT` above (after data is clean).

---

## Preflight (before migration)

Count rows that would violate the new rule:

```sql
SELECT COUNT(*)::bigint AS "missing_development_plan_count"
FROM "talent"."succession_plans" s
WHERE s."status" IN (
    'ACTIVE'::"talent"."succession_plan_status",
    'UNDER_REVIEW'::"talent"."succession_plan_status"
  )
  AND (
    s."developmentPlan" IS NULL
    OR length(trim(s."developmentPlan"::text)) = 0
  );
```

Remediation: backfill `developmentPlan` from templates, or demote `status` to `DRAFT` until content exists.

---

## CI gate script (when enabled)

Mirror `scripts/check-succession-plans-preflight.ts`: add a fourth query (or new script `check-succession-plans-development-preflight.ts`) that fails the job when `missing_development_plan_count > 0`.

Suggested env skip: `SKIP_SUCCESSION_PLANS_DEVELOPMENT_PREFLIGHT=1` for jobs without a DB.

## Nightly staging (before the CHECK exists)

Use **`pnpm report:succession-plans-development-gap`** (`scripts/report-succession-plans-development-gap.ts`) to log counts without failing the build; optional Slack + `GITHUB_OUTPUT` wiring is sketched in **`docs/CI_GATES.md`** → *Nightly: succession development-plan gap (staging)*.

---

## Metrics & trend charts (optional)

Goal: store **one number per night** so product can see the gap **decreasing** before you enable `chk_succession_plans_development_when_live`.

### Built-in (no extra vendors)

| Mechanism | What you get |
|-----------|----------------|
| **`GITHUB_STEP_SUMMARY`** | The report script appends a markdown snippet per run. Open **Actions → workflow run → Summary** and scroll history by date (manual trend eyeball). |
| **`SUCCESSION_DEV_PLAN_GAP_JSON_LINE=1`** | Stdout is a **single JSON** object: `succession_plans_live_without_development_plan_count`, `recorded_at`, `metric`. Pipe to a follow-up step: `pnpm report:... \| tee gap.json` then `jq` and POST. |

Example JSON line:

```json
{"succession_plans_live_without_development_plan_count":12,"recorded_at":"2026-03-20T06:30:00.000Z","metric":"talent.succession_plans.development_plan_gap"}
```

### GitHub Actions → time series (sketch)

1. **Nightly job** runs the report with `SUCCESSION_DEV_PLAN_GAP_JSON_LINE=1`.
2. **Next step** (bash) reads count and pushes to your stack, e.g.:
   - **Datadog**: `curl -X POST "https://api.datadoghq.com/api/v1/series?api_key=$DD_API_KEY" -d @- <<EOF` with `metrics` body (gauge); or **DogStatsD** from a sidecar if you use self-hosted agents.
   - **Prometheus Pushgateway**: `echo 'talent_succession_dev_plan_gap $COUNT' \| curl --data-binary @- $PUSHGATEWAY/metrics/job/gha_nightly`
   - **Honeycomb / OpenTelemetry**: OTLP gauge export from a tiny Node step using the JSON field.
   - **BigQuery / Snowflake**: `bq insert` or `snowsql` append one row `(run_date, env, gap_count)` for Looker/Mode.
3. **Dashboard**: chart `gap_count` over `recorded_at` / run date; alert when slope stops improving before flipping the CHECK.

### Minimal “artifact trend” (no SaaS)

Upload the JSON line as a **dated artifact** each night; a separate weekly job downloads last N artifacts and plots locally — heavier to maintain; prefer Pushgateway or warehouse append.

---

## Rollout order

1. Run preflight `SELECT` on staging → fix data.
2. Ship migration adding `chk_succession_plans_development_when_live`.
3. Extend `pnpm check:succession-plans-preflight` (or add a dedicated script) and document in `CI_GATES.md`.

---

## Zod (optional alignment)

If the CHECK is on, tighten API validation for inserts/updates when `status` is `ACTIVE` | `UNDER_REVIEW`:

- `developmentPlan: z.string().min(1).max(4000)` for those transitions (often easier in application logic than in `createInsertSchema` refinements).
