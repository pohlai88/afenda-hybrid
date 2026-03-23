# Tailwind CSS v4 — Complete Change Reference

## Removed Deprecated Utilities

| Removed                 | Replacement                                   |
| ----------------------- | --------------------------------------------- |
| `bg-opacity-*`          | `bg-{color}/{opacity}` (e.g. `bg-red-500/50`) |
| `text-opacity-*`        | `text-{color}/{opacity}`                      |
| `border-opacity-*`      | `border-{color}/{opacity}`                    |
| `divide-opacity-*`      | `divide-{color}/{opacity}`                    |
| `ring-opacity-*`        | `ring-{color}/{opacity}`                      |
| `placeholder-opacity-*` | `placeholder-{color}/{opacity}`               |
| `flex-shrink`           | `shrink`                                      |
| `flex-grow`             | `grow`                                        |
| `overflow-ellipsis`     | `text-ellipsis`                               |
| `decoration-slice`      | `box-decoration-slice`                        |
| `decoration-clone`      | `box-decoration-clone`                        |

## Renamed Utilities

| v3               | v4                                                    |
| ---------------- | ----------------------------------------------------- |
| `shadow-sm`      | `shadow-xs`                                           |
| `shadow`         | `shadow-sm`                                           |
| `drop-shadow-sm` | `drop-shadow-xs`                                      |
| `drop-shadow`    | `drop-shadow-sm`                                      |
| `blur-sm`        | `blur-xs`                                             |
| `blur`           | `blur-sm`                                             |
| `rounded-sm`     | `rounded-xs`                                          |
| `rounded`        | `rounded-sm`                                          |
| `outline-none`   | `outline-hidden` (for truly none: `outline-none`)     |
| `ring`           | `ring-3` (default ring width changed from 3px to 1px) |

## Selector Changes

### space-between (`space-x-*`, `space-y-*`)

- v3: `> * + *` (adjacent sibling)
- v4: `> :not(:last-child)` wrapped in `:where()` (lower specificity)

### divide (`divide-x-*`, `divide-y-*`)

- v3: `> * + *`
- v4: `> :not(:last-child)` wrapped in `:where()`

## Preflight Changes

- Placeholder text color: now `currentColor` at 50% opacity (was `gray-400`)
- Buttons default `cursor: default` (was `cursor: pointer`)

## Default Value Changes

| Property                   | v3 Default    | v4 Default     |
| -------------------------- | ------------- | -------------- |
| `border-color`             | `gray-200`    | `currentColor` |
| `ring-width` (bare `ring`) | `3px`         | `1px`          |
| `ring-color`               | `blue-500/50` | `currentColor` |

If code relies on bare `border` being gray, add explicit `border-gray-200`.

## Gradient Variant Syntax

Variants with gradients must be applied to the whole gradient shorthand, not individual stop utilities:

```html
<!-- v3 (worked) -->
<div class="from-red-500 hover:to-blue-500">
  <!-- v4 (required) -->
  <div class="bg-linear-to-r from-red-500 to-green-500 hover:to-blue-500"></div>
</div>
```

## Container Configuration

Configure in CSS instead of JS config:

```css
@utility container {
  margin-inline: auto;
  padding-inline: 2rem;
  max-width: theme(--breakpoint-xl);
}
```

## Prefix Syntax

```css
@import "tailwindcss" prefix(tw);
```

Usage: `tw:bg-red-500` (colon separator, not dash).

## Important Modifier

Still uses `!` prefix but in v4 it goes before the utility name:

```html
<!-- Same syntax, still works -->
<div class="!font-bold"></div>
```

## Custom Utilities

Use `@utility` instead of `@layer utilities`:

```css
/* v3 */
@layer utilities {
  .tab-4 {
    tab-size: 4;
  }
}

/* v4 */
@utility tab-4 {
  tab-size: 4;
}
```

Custom utilities must be a single class name (no complex selectors).

## Variant Stacking Order

v4 applies variants left-to-right (was right-to-left in v3):

```html
<!-- v3: first applied dark, then hover → dark:hover -->
<!-- v4: first applied first, then second → same visual result for most cases -->
<div class="dark:hover:bg-red-500"></div>
```

## Variables in Arbitrary Values

Use parentheses `()` instead of brackets `[]` for CSS variables in arbitrary values:

```html
<!-- v3 -->
<div class="bg-[--brand-color]">
  <!-- v4 -->
  <div class="bg-(--brand-color)"></div>
</div>
```

## Hover on Mobile

v4 uses `@media (hover: hover)` for `hover:` variant, so hover styles only apply on devices that support hover. To force old behavior:

```css
@variant hover (&:hover);
```

## Transitioning outline-color

v4 includes `outline-color` in default transition properties. If `outline-color` was `transparent` before, transitions may flash.

## Individual Transform Properties

v4 uses individual CSS properties (`translate`, `rotate`, `scale`) instead of the compound `transform` property. This means `transform-gpu` and `transform-none` behave differently.

## Disabling Core Plugins

Not supported in v4. Core plugins are always enabled.

## Color Value Format

v4 uses `oklch` by default for built-in colors. Custom colors can use any format. HSL values from v3 configs work fine in `@theme`.

## @theme Inline Option

Prevent v4 from generating CSS variables for theme values:

```css
@theme inline {
  --color-primary: #6366f1;
}
```

This makes the value available to utilities but doesn't create a `--color-primary` CSS variable.
