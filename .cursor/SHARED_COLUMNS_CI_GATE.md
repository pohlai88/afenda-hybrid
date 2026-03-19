# Shared Columns CI Gate Implementation

**Date**: 2026-03-19  
**Scope**: `src/db/schema/_shared/` and CI enforcement

---

## Summary

Implemented a comprehensive CI gate for shared column mixin enforcement with:

1. **Refactored `_shared` directory** with improved documentation and fingerprints
2. **Exception system** for justified bypasses
3. **New CI checker** (`check:shared`) for duplication detection
4. **Updated existing checkers** to skip `_shared` directory

---

## Files Created/Modified

### New Files

#### `src/db/schema/_shared/timestamps.ts`
- Enhanced documentation with usage examples
- Added `TIMESTAMP_FINGERPRINTS` for CI detection
- Stability marker for team review requirements

#### `src/db/schema/_shared/auditColumns.ts`
- Enhanced documentation explaining no FK constraints (intentional)
- Added `AUDIT_FINGERPRINTS` for CI detection

#### `src/db/schema/_shared/tenantScope.ts`
- Enhanced documentation with bypass instructions
- Added `TENANT_FINGERPRINTS` for CI detection
- Clear guidance on when to use explicit tenantId

#### `src/db/schema/_shared/index.ts`
- Comprehensive barrel export with documentation
- Exports `MANDATORY_SHARED_COLUMNS` and `RECOMMENDED_SHARED_COLUMNS`
- Exports `ALL_SHARED_FINGERPRINTS` for CI tools

#### `scripts/config/shared-exceptions.json`
- Exception list for justified mixin bypasses
- Pre-populated with core schema exceptions
- JSON Schema validation support

#### `scripts/config/shared-exceptions.schema.json`
- JSON Schema for exception file validation
- Enforces required fields: file, table, column, rule, reason, owner, date

#### `scripts/check-shared-columns.ts`
- New CI checker for shared column enforcement
- Detects manual definitions of shared columns
- Suggests promotion for duplicate patterns (3+ occurrences)
- Warns for duplicates at 5+ occurrences
- Respects exception file and inline comments

#### `src/db/__tests__/shared-columns.test.ts`
- Tests for mixin exports
- Tests for CI enforcement constants
- Tests for core schema usage

### Modified Files

#### `package.json`
- Added `check:shared` script
- Updated `check:all` to include shared column check

#### `scripts/check-guideline-compliance-v2.ts`
- Removed mixin warnings (moved to dedicated checker)

#### `scripts/check-naming-conventions.ts`
- Added `_shared` directory exclusion

#### `scripts/check-tenant-isolation.ts`
- Added `_shared` directory exclusion

#### `scripts/check-constraint-patterns.ts`
- Added `_shared` directory exclusion

---

## CI Gate Rules

### Mandatory (Error)
- `createdAt` and `updatedAt` MUST use `timestampColumns` mixin
- Exception required in `shared-exceptions.json` to bypass

### Recommended (Warning)
- `deletedAt` SHOULD use `softDeleteColumns` mixin
- `createdBy`/`updatedBy` SHOULD use `auditColumns` mixin
- `tenantId` SHOULD use `tenantScopedColumns` mixin
- Bypass allowed with:
  - Exception in `shared-exceptions.json`, OR
  - Inline comment containing "// explicit" or "// Explicit"

### Promotion Suggestions (Info)
- Column appearing in 3+ tables: suggestion to promote
- Column appearing in 5+ tables: warning to promote

---

## Exception System

### Adding an Exception

1. Edit `scripts/config/shared-exceptions.json`
2. Add entry with required fields:

```json
{
  "file": "src/db/schema/core/organizations.ts",
  "table": "organizations",
  "column": "tenantId",
  "rule": "use-tenant-mixin",
  "reason": "Explicit tenantId for precise FK control with onDelete/onUpdate actions",
  "owner": "core-team",
  "date": "2026-03-19"
}
```

### Inline Bypass

Add comment to column definition:

```typescript
tenantId: integer().notNull(), // explicit for FK control
```

---

## Current Exceptions

| File | Table | Column | Reason |
|------|-------|--------|--------|
| core/tenants.ts | tenants | tenantId | PK, not FK reference |
| core/organizations.ts | organizations | tenantId | Explicit FK control |
| core/locations.ts | locations | tenantId | Explicit FK control |
| core/regions.ts | regions | tenantId | Shared reference data |
| audit/auditTrail.ts | audit_trail | tenantId | Special FK requirements |

---

## Validation Results

### TypeScript
```bash
✓ pnpm typecheck - No errors
```

### Drizzle Kit
```bash
✓ pnpm db:check - Everything's fine 🐶🔥
```

### CI Checks
```bash
✓ pnpm check:naming - All naming conventions passed
✓ pnpm check:tenant - All tenant isolation checks passed
✓ pnpm check:shared - 0 errors, 0 warnings, 1 info
✓ pnpm gate:early - All gates passed
```

### Tests
```bash
✓ 16/16 shared column tests passing
✓ 86/86 total tests passing
```

---

## Usage

### Run Shared Column Check
```bash
pnpm check:shared
```

### Run All CI Checks
```bash
pnpm check:all
```

### Run Full Early Gate
```bash
pnpm gate:early
```

---

## Architecture Decisions

### Why Separate Checker?

The shared column checker is separate from `check-guideline-compliance-v2.ts` because:

1. **Single Responsibility**: Dedicated tool for shared column concerns
2. **Exception System**: Needs its own configuration file
3. **Duplication Detection**: Requires cross-file analysis
4. **Clearer Output**: Focused reporting on mixin issues

### Why Exception File?

Using `shared-exceptions.json` instead of inline-only bypasses:

1. **Centralized Audit**: All exceptions visible in one place
2. **Required Justification**: `reason` field is mandatory
3. **Ownership Tracking**: `owner` and `date` for accountability
4. **Schema Validation**: JSON Schema ensures correct format

### Why Fingerprints?

Column fingerprints (`type:modifiers`) enable:

1. **Accurate Duplication Detection**: Match by structure, not just name
2. **Future Automation**: Could auto-generate mixin suggestions
3. **Documentation**: Clear definition of what each mixin provides

---

## Future Enhancements

1. **Auto-fix**: Generate mixin replacements automatically
2. **Promotion Workflow**: Script to create new shared column from duplicates
3. **Exception Expiry**: Warn on old exceptions (e.g., >6 months)
4. **IDE Integration**: VS Code extension for inline warnings

---

## Conclusion

The shared column CI gate ensures:

✅ **Consistency**: All tables use standard column patterns  
✅ **Discoverability**: Duplicate patterns are surfaced for promotion  
✅ **Flexibility**: Exception system allows justified bypasses  
✅ **Accountability**: All exceptions require documented reasons  
✅ **Maintainability**: Single source of truth for shared columns  

The implementation follows the DB-first guideline principle of enforcing invariants at the infrastructure level while providing escape hatches for legitimate edge cases.
