---
name: react-compiler-directives
description: React Compiler directives and build-time compilation notes.
---

## Purpose

Use **compiler directives** sparingly and document them. Prefer project-level compiler configuration over per-file escape hatches.

## When to Apply

- Adopting or troubleshooting `babel-plugin-react-compiler` / framework integration
- A third-party or dynamic pattern blocks safe automatic memoization
- Shipping **library** code that may be pre-compiled for consumers

## Anti-Patterns

- `"use no memo"` without a comment and tracking issue
- Directives as a default instead of fixing the underlying impure render
- Assuming compiler is enabled without verifying build config

## Code Examples

```tsx
function ProblematicGrid() {
  "use no memo"; // TODO(JIRA-xxx): remove after fixing dynamic row height measure in third-party grid
  return <ThirdPartyGrid />;
}
```

Official guidance: [React Compiler — Directives](https://react.dev/reference/react-compiler/directives).

## AFENDA Mapping

- **Monorepo packages:** If compiling libraries, follow React’s “compiling libraries” guidance and declare compatible React versions.
- **Apps:** Prefer infer/annotation modes per team policy; keep directives rare and documented.
