# AFENDA-HYBRID Quick Start Guide

**Last Updated**: March 20, 2026  
**Status**: ✅ Environment Ready

---

## 🚀 First Time Setup (Already Done!)

✅ Docker test database is running  
✅ Environment variables configured  
✅ Migrations applied  
✅ Git repository initialized  

---

## 📋 Daily Development Commands

### Database Operations

```bash
# Start database (if stopped)
pnpm docker:test:start

# Check database status
pnpm docker:test:status

# Open Drizzle Studio (visual database browser)
pnpm db:studio

# Open psql shell
pnpm docker:test:shell
```

### Schema Changes Workflow

```bash
# 1. Edit schema files in src/db/schema/

# 2. Generate migration
pnpm db:generate

# 3. Validate migration format
pnpm check:migrations

# 4. Check for schema drift
pnpm check:drift

# 5. Apply migration
pnpm db:migrate

# 6. Verify in Drizzle Studio
pnpm db:studio
```

### Testing

```bash
# Run smoke tests (quick validation)
pnpm test:db:smoke

# Run all database tests
pnpm test:db

# Run contract tests
pnpm test:db:contracts

# Run all tests
pnpm test
```

### Validation & Quality Checks

```bash
# Run all validation checks
pnpm check:all

# Run early gate (fast checks for pre-commit)
pnpm gate:early

# Run strict gate (for CI/CD)
pnpm gate:strict

# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format
pnpm format:check
```

---

## 🔧 Docker Database Management

```bash
# Start database
pnpm docker:test:start

# Stop database (keeps data)
pnpm docker:test:stop

# Stop and remove container
pnpm docker:test:down

# Reset database (removes all data and restarts)
pnpm docker:test:reset

# View logs
pnpm docker:test:logs

# Check status
pnpm docker:test:status

# Open psql shell
pnpm docker:test:shell
```

**Connection String**:
```
postgresql://postgres:postgres@localhost:5433/afenda_test
```

---

## 📁 Project Structure

```
d:\AFENDA-HYBRID\
├── src/
│   └── db/
│       ├── schema/           # Drizzle ORM schema definitions
│       │   ├── core/         # Core business entities
│       │   ├── security/     # Auth & access control
│       │   ├── audit/        # Audit trail & logging
│       │   ├── hr/           # Human resources
│       │   ├── finance/      # Financial entities
│       │   └── index.ts      # Schema barrel export
│       ├── migrations/       # Generated SQL migrations
│       └── db.ts             # Database connection
├── scripts/                  # Validation & automation scripts
├── docs/                     # Documentation
│   ├── SCHEMA_LOCKDOWN.md   # Schema lockdown guide
│   ├── BLOCKER_RESOLUTION_SUMMARY.md
│   └── architecture/
│       └── 01-db-first-guideline.md
├── .env                      # Environment variables (not in Git)
├── .env.example              # Environment template
├── drizzle.config.ts         # Drizzle Kit configuration
└── docker-compose.test.yml   # Test database configuration
```

---

## 🛡️ Schema Lockdown Rules

### ❌ NEVER Use
```bash
pnpm db:push  # DISABLED - bypasses migration tracking
```

### ✅ ALWAYS Use
```bash
pnpm db:generate  # Generate migration
pnpm db:migrate   # Apply migration
```

### Emergency Bypass (Local Dev Only)
```bash
pnpm db:push:unsafe  # Use with extreme caution!
```

---

## 📝 Custom SQL Guidelines

### When to Use Custom SQL
- Table partitioning
- Triggers and trigger functions
- PostgreSQL-specific indexes (GIN, GIST)
- Row-level security policies
- Database functions/procedures

### Required Steps
1. Add `-- CUSTOM: CSQL-XXX` marker in migration file
2. Register in `src/db/schema/audit/CUSTOM_SQL_REGISTRY.json`
3. Document in `src/db/schema/audit/CUSTOM_SQL.md`
4. Get DBA approval (use GitHub issue template)

**See**: `docs/SCHEMA_LOCKDOWN.md` for full process

---

## 🔍 Validation Checks

| Command | Purpose | When to Run |
|---------|---------|-------------|
| `check:naming` | Naming conventions | Before commit |
| `check:structure` | Schema structure | Before commit |
| `check:compliance` | Guideline compliance | Before commit |
| `check:tenant` | Tenant isolation | Before commit |
| `check:migrations` | Migration format | After `db:generate` |
| `check:drift` | Schema drift | Before commit |
| `check:all` | All checks | Before PR |
| `gate:early` | Fast gate checks | Pre-commit hook |
| `gate:strict` | Strict gate checks | CI/CD |

---

## 🐛 Troubleshooting

### Database won't start
```bash
# Check Docker is running
docker ps

# View logs
pnpm docker:test:logs

# Reset database
pnpm docker:test:reset
```

### Migration fails
```bash
# Check environment
pnpm db:prepare

# Verify database is running
pnpm docker:test:status

# Check migration format
pnpm check:migrations

# View database logs
pnpm docker:test:logs
```

### Schema drift detected
```bash
# Check what changed
pnpm check:drift

# Generate new migration
pnpm db:generate

# Apply migration
pnpm db:migrate
```

### Environment variables not loading
```bash
# Check .env file exists
cat .env

# Verify DATABASE_URL is set
echo $env:DATABASE_URL

# Run preparation check
pnpm db:prepare
```

---

## 🎯 Common Tasks

### Add a New Table
1. Create schema file in `src/db/schema/<domain>/`
2. Export from domain `index.ts`
3. Generate migration: `pnpm db:generate`
4. Validate: `pnpm check:migrations`
5. Apply: `pnpm db:migrate`
6. Verify: `pnpm db:studio`

### Add a New Column
1. Edit schema file
2. Generate migration: `pnpm db:generate`
3. Validate: `pnpm check:migrations`
4. Apply: `pnpm db:migrate`

### Add Custom SQL (Trigger, Partition, etc.)
1. Generate migration: `pnpm db:generate`
2. Edit migration file, add custom SQL with `-- CUSTOM: CSQL-XXX` marker
3. Register in `CUSTOM_SQL_REGISTRY.json`
4. Document in `CUSTOM_SQL.md`
5. Create GitHub issue for approval
6. Validate: `pnpm check:migrations`
7. Apply: `pnpm db:migrate`

### Reset Database to Clean State
```bash
pnpm docker:test:reset
pnpm db:migrate
```

---

## 📚 Key Documentation

- **Schema Lockdown**: `docs/SCHEMA_LOCKDOWN.md`
- **Database Guidelines**: `docs/architecture/01-db-first-guideline.md`
- **Custom SQL**: `src/db/schema/audit/CUSTOM_SQL.md`
- **Migration Readiness**: `MIGRATION_READINESS_REPORT.md`
- **Blocker Resolution**: `docs/BLOCKER_RESOLUTION_SUMMARY.md`

---

## 🔗 Useful Links

- **Drizzle ORM Docs**: https://orm.drizzle.team/
- **Drizzle Kit Docs**: https://orm.drizzle.team/kit-docs/overview
- **PostgreSQL Docs**: https://www.postgresql.org/docs/16/

---

## 💡 Tips

- Use `pnpm db:studio` to visually explore your database
- Run `pnpm gate:early` before committing
- Check `pnpm docker:test:status` if migrations fail
- Keep migrations small and focused
- Always validate with `pnpm check:migrations` after generating
- Use `pnpm check:drift` to catch uncommitted schema changes

---

**Happy Coding! 🚀**
