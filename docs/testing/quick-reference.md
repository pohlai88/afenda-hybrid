# AFENDA testing quick reference

## Quick commands

```bash
# Run all tests
pnpm test

# Run UI package tests only
pnpm test:ui-packages

# Run specific package
pnpm --filter @afenda/view-engine test

# Watch mode (development)
pnpm test:watch

# With coverage
pnpm test:coverage

# Type tests only
pnpm --filter @afenda/view-engine test:type

# CI mode (bail on first failure)
pnpm test:ci
```

---

## Test structure

### Unit tests

```typescript
// src/__tests__/my-feature.test.ts
import { describe, it, expect } from "vitest";

describe("MyFeature", () => {
  it("does something", () => {
    expect(result).toBe(expected);
  });
});
```

### Component tests

```typescript
// src/__tests__/my-component.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Type tests

```typescript
// src/__tests__/types.test-d.ts
import { describe, test, expectTypeOf } from "vitest";

describe("Type Contracts", () => {
  test("ensures type safety", () => {
    expectTypeOf<MyType>().toHaveProperty("requiredField");
  });
});
```

---

## Common patterns

### Testing hooks

```typescript
import { renderHook, act } from "@testing-library/react";

it("updates state", () => {
  const { result } = renderHook(() => useMyHook());

  act(() => {
    result.current.update("value");
  });

  expect(result.current.state).toBe("value");
});
```

### Testing async

```typescript
it("handles async operations", async () => {
  const promise = fetchData();
  await expect(promise).resolves.toBe("data");
});
```

### Mocking functions

```typescript
import { vi } from "vitest";

const mockFn = vi.fn();
mockFn.mockReturnValue("result");
mockFn.mockResolvedValue("async result");

expect(mockFn).toHaveBeenCalledWith("arg");
```

### Spying

```typescript
const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
// ... code that logs
expect(spy).toHaveBeenCalledWith(expect.stringContaining("warning"));
spy.mockRestore();
```

---

## Coverage thresholds

| Package         | Lines | Functions | Branches | Statements |
| --------------- | ----- | --------- | -------- | ---------- |
| `view-engine`   | 80%   | 75%       | 70%      | 80%        |
| `ui`            | 75%   | 70%       | 65%      | 75%        |
| `erp-view-pack` | 70%   | 65%       | 60%      | 70%        |

Tests fail if coverage drops below these thresholds.

---

## Troubleshooting

### Test fails locally but passes in CI

- Run with shuffle: `CI=1 pnpm test`
- Check for hidden test dependencies
- Ensure proper cleanup in `afterEach`

### Memory issues

- Tests use `--max-old-space-size=4096` via package scripts
- If still failing, check for infinite loops in effects
- Use `test.only` to isolate problematic tests

### Type test failures

- Run `pnpm typecheck` first to see compile errors
- Type tests use `expectTypeOf` for type-level assertions
- Use `.toMatchTypeOf` for assignability, `.toEqualTypeOf` for exact match

### Flaky tests

- Check if test modifies global state
- Ensure `clearMocks: true` is working
- Add explicit cleanup in `afterEach`
- Use `test.sequential` if tests must run in order

---

## Best practices

### Do

- Use `act()` for state updates in hooks
- Mock browser APIs in setup files
- Use `screen.getByRole` over `getByText` when possible
- Write type tests for public contracts
- Keep tests focused and isolated
- Use descriptive test names

### Don’t

- Modify global state without cleanup
- Use `rerender` to test prop changes for uncontrolled forms (prefer unmount/remount)
- Skip `act()` warnings
- Use `any` in test types
- Test implementation details
- Write tests that depend on execution order

---

## CI integration

### GitHub Actions

```yaml
- name: Run tests
  run: pnpm test:ci

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./packages/*/coverage/lcov.info
```

### Test results

- JSON output: `./test-results/results.json`
- JUnit XML: `./test-results/junit.xml`
- Coverage: `./packages/*/coverage/`

---

## Performance tips

### Slow tests

- Use `test.concurrent` for independent async tests
- Reduce `testTimeout` for fast tests
- Use `--reporter=dot` for faster output
- Run specific test file: `vitest run path/to/test.ts`

### Watch mode

- Uses smart change detection
- Only reruns affected tests
- Use `--reporter=dot` for cleaner output

---

## Type testing guide

### Basic assertions

```typescript
expectTypeOf<Type>().toBeString();
expectTypeOf<Type>().toBeNumber();
expectTypeOf<Type>().toBeBoolean();
expectTypeOf<Type>().toHaveProperty("field");
```

### Assignability

```typescript
// Test that A can be assigned to B
expectTypeOf<A>().toMatchTypeOf<B>();

// Test that A and B are exactly the same
expectTypeOf<A>().toEqualTypeOf<B>();
```

### Union types

```typescript
// Test that value is assignable to union
expectTypeOf<"list">().toMatchTypeOf<ViewKind>();

// Test exact union
expectTypeOf<ViewKind>().toEqualTypeOf<"list" | "form" | "kanban">();
```

---

## Debugging tests

```bash
vitest run -t "test name pattern"
vitest run path/to/test.ts
vitest --inspect-brk
pnpm --filter @afenda/view-engine test:ui
```

---

## Coverage reports

```bash
pnpm test:coverage
# Then open e.g. packages/view-engine/coverage/index.html
```

---

## Migration notes (Vitest 4)

- `poolOptions` → top-level `maxWorkers` / `minWorkers`
- Prefer `clearMocks`, `restoreMocks`, `mockReset`, `isolate: true`
- Coverage thresholds and typecheck blocks live in `vitest.config.ts`

---

## More documentation

- [vitest-upgrade.md](./vitest-upgrade.md) — configuration upgrade narrative and file list
- [../../.agents/skills/vitest/SKILL.md](../../.agents/skills/vitest/SKILL.md) — Vitest agent skill
