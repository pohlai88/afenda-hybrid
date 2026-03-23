---
name: tailwind-v4-upgrade
description: >-
  Upgrade Tailwind CSS from v3 to v4 in monorepos and Next.js projects.
  Use when upgrading Tailwind, migrating tailwind.config to CSS @theme,
  replacing @tailwind directives, switching to @tailwindcss/postcss or
  @tailwindcss/vite, or troubleshooting v4 migration issues.
---

# Tailwind CSS v4 Upgrade

## Prerequisites

- Node.js 20+
- Tailwind v4 targets **Safari 16.4+, Chrome 111+, Firefox 128+**
- v4 is incompatible with Sass, Less, and Stylus

## Quick Start — Automated

```bash
npx @tailwindcss/upgrade
```

Run on a fresh branch. Review diff carefully. The tool handles most changes but complex projects need manual fixes.

## Manual Upgrade Steps

### 1. Update Dependencies

**PostCSS projects** (Next.js, etc.):

```bash
pnpm remove tailwindcss autoprefixer postcss-import
pnpm add -D @tailwindcss/postcss postcss
```

**Vite projects** (Storybook, Vite apps):

```bash
pnpm remove tailwindcss
pnpm add -D @tailwindcss/vite
```

Both: keep `tailwind-merge` as-is (compatible).

### 2. Update PostCSS Config

Replace the `tailwindcss` and `autoprefixer` plugins with `@tailwindcss/postcss`:

```js
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Remove `postcss-import` (v4 handles imports automatically).

### 3. Update Vite Config (if applicable)

```ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

### 4. Replace @tailwind Directives

```css
/* v3 — remove these */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* v4 — single import */
@import "tailwindcss";
```

### 5. Migrate tailwind.config to CSS @theme

v4 uses CSS-first configuration. Move theme customizations into your CSS file:

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.6 0.25 265);
  --color-secondary: oklch(0.7 0.15 200);
  --radius-lg: 0.5rem;
  --font-sans: "Inter", system-ui, sans-serif;
}
```

If you still need a JS config (plugins, complex logic), load it explicitly:

```css
@config "../../tailwind.config.js";
```

### 6. Key Syntax Changes

| v3                                    | v4                                                                   |
| ------------------------------------- | -------------------------------------------------------------------- |
| `@tailwind base/components/utilities` | `@import "tailwindcss"`                                              |
| `tailwindcss` (PostCSS plugin)        | `@tailwindcss/postcss`                                               |
| `tailwind.config.ts` (auto-detected)  | CSS `@theme {}` or explicit `@config`                                |
| `theme()` function                    | CSS variables: `var(--color-red-500)`                                |
| `theme(screens.xl)` in media queries  | `theme(--breakpoint-xl)`                                             |
| `content: [...]` in config            | Automatic detection (uses `.gitignore`)                              |
| `darkMode: "class"` in config         | Use `@variant dark { &:where(.dark, .dark *) }` or `@custom-variant` |

### 7. Content Detection

v4 automatically scans your project using heuristics and `.gitignore`. Remove `content` arrays from config. To add extra sources:

```css
@source "../../packages/ui-core/src/**/*.{ts,tsx}";
```

### 8. Dark Mode

v4 defaults to `prefers-color-scheme`. For class-based dark mode:

```css
@import "tailwindcss";
@variant dark (&:where(.dark, .dark *));
```

### 9. CSS Modules / Vue / Svelte Style Blocks

Use `@reference` to access theme variables without duplicating CSS:

```css
@reference "../../app.css";

h1 {
  @apply text-2xl font-bold;
}
```

## Breaking Changes Checklist

- [ ] `@tailwind` directives replaced with `@import "tailwindcss"`
- [ ] PostCSS plugin changed to `@tailwindcss/postcss`
- [ ] Vite plugin changed to `@tailwindcss/vite` (if using Vite)
- [ ] `autoprefixer` removed (v4 handles vendor prefixes)
- [ ] `postcss-import` removed (v4 handles imports)
- [ ] `tailwind.config` migrated to `@theme {}` in CSS (or loaded via `@config`)
- [ ] `content` arrays removed (v4 auto-detects)
- [ ] `darkMode: "class"` migrated to `@variant dark`
- [ ] `theme()` calls updated to CSS variables or new `theme(--var)` syntax
- [ ] Default border color changed (was `gray-200`, now `currentColor`)
- [ ] Default ring width changed (was `3px`, now `1px`)
- [ ] Ring color changed (was `blue-500/50`, now `currentColor`)
- [ ] `shadow-sm/shadow-md` scale shifted (old `shadow` → new `shadow-sm`)
- [ ] `space-x/y-*` now uses `:where()` (lower specificity)

## Monorepo Considerations

- Shared UI packages: migrate `@tailwind` directives in the shared CSS first
- App packages: update PostCSS config per-app
- Storybook (Vite-based): use `@tailwindcss/vite` plugin
- Use `@source` to ensure cross-package class scanning
- Shared `tailwind.config.ts` can stay if loaded via `@config` from each consumer

## Troubleshooting

- **Classes not applied**: Check that `@source` paths cover all template files
- **Build errors**: Ensure Node.js 20+ and remove old `tailwindcss` package
- **Storybook unstyled**: Add `@tailwindcss/vite` to Storybook's Vite config
- **CSS variables not resolving**: Verify `@theme` block or `@config` directive
- **Vue/Svelte styles broken**: Add `@reference` to style blocks

## Additional Resources

- For complete v3→v4 change reference, see [v4-changes.md](v4-changes.md)
