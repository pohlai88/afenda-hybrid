# Docker Test Database Setup

This guide explains how to use Docker for running database integration tests.

## Quick Start

```bash
# Start the test database
pnpm docker:test:start

# Run tests
pnpm test:db

# Stop the test database
pnpm docker:test:stop
```

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ and pnpm installed

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm docker:test:start` | Start the test database container |
| `pnpm docker:test:stop` | Stop the container (keeps data) |
| `pnpm docker:test:down` | Stop and remove the container |
| `pnpm docker:test:reset` | Reset database (remove all data) |
| `pnpm docker:test:status` | Check if database is running |
| `pnpm docker:test:shell` | Open psql shell to test database |
| `pnpm docker:test:logs` | View database logs |

## Configuration

### Default Connection

The test database uses these defaults:
- **Host**: `localhost`
- **Port**: `5433` (to avoid conflicts with local PostgreSQL on 5432)
- **Database**: `afenda_test`
- **User**: `postgres`
- **Password**: `postgres`
- **Connection String**: `postgresql://postgres:postgres@localhost:5433/afenda_test`

### Custom Configuration

To use a different database, set the `DATABASE_URL` environment variable:

```bash
# Using .env.test file
echo "DATABASE_URL=postgresql://user:pass@host:5432/dbname" > .env.test
pnpm test:db

# Or inline
DATABASE_URL=postgresql://user:pass@host:5432/dbname pnpm test:db
```

## Test Workflow

### 1. Start Database

```bash
pnpm docker:test:start
```

This will:
- Pull PostgreSQL 16 Alpine image (if not already present)
- Create and start the container
- Install required extensions (`btree_gist`, `pgcrypto`)
- Wait for database to be ready

### 2. Run Migrations

Migrations are automatically applied when tests run (via `setup.ts`). To manually run migrations:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/afenda_test pnpm db:migrate
```

### 3. Run Tests

```bash
# All database tests
pnpm test:db

# Smoke tests only
pnpm test:db:smoke

# Contract tests only
pnpm test:db:contracts
```

### 4. Clean Up

```bash
# Stop container (keeps data for next run)
pnpm docker:test:stop

# Or remove container and data
pnpm docker:test:down
```

## Test Setup Process

When tests run, the `setup.ts` file automatically:

1. **Waits for database** - Checks connection with retries
2. **Verifies extensions** - Ensures `btree_gist` and `pgcrypto` are installed
3. **Runs migrations** - Applies all migrations from `src/db/migrations/`

If any step fails, tests will not run and you'll see a clear error message.

## Troubleshooting

### Database Not Starting

```bash
# Check container status
pnpm docker:test:status

# View logs
pnpm docker:test:logs

# Reset and try again
pnpm docker:test:reset
```

### Port Already in Use

If port 5433 is already in use:

1. Change the port in `docker-compose.test.yml`:
   ```yaml
   ports:
     - "5434:5432"  # Use 5434 instead
   ```

2. Update `DATABASE_URL`:
   ```bash
   export DATABASE_URL=postgresql://postgres:postgres@localhost:5434/afenda_test
   ```

### Migration Errors

If migrations fail:

```bash
# Check if migrations directory exists
ls -la src/db/migrations/

# Generate migrations if needed
pnpm db:generate

# Run migrations manually
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/afenda_test pnpm db:migrate
```

### Extension Installation Failed

The extensions should install automatically. If they don't:

```bash
# Connect to database
pnpm docker:test:shell

# Install manually
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## CI/CD Integration

The Docker setup is designed to work seamlessly with CI/CD. The GitHub Actions workflow (`.github/workflows/db-ci.yml`) uses a similar setup.

For local CI simulation:

```bash
# Start database
pnpm docker:test:start

# Run full test suite
pnpm test:db

# Run schema checks
pnpm gate:strict

# Clean up
pnpm docker:test:down
```

## Data Persistence

Test data is stored in a Docker volume (`postgres-test-data`). This means:

- Data persists between container restarts
- Use `pnpm docker:test:reset` to clear all data
- Use `pnpm docker:test:down` to remove the volume

## Performance Tips

1. **Keep container running** - Don't stop/start between test runs
2. **Use connection pooling** - The setup uses connection pooling automatically
3. **Parallel tests** - Vitest config uses single fork for database tests to avoid conflicts

## Security Notes

⚠️ **Important**: The test database uses default credentials and is **NOT** secure. Never use this configuration in production.

- Default password: `postgres`
- No authentication required
- Only accessible from localhost
- Intended for development/testing only
