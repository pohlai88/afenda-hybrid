/**
 * AFENDA Design System — JS Token Exports
 *
 * Typed color scales, module palette, and helper utilities.
 * These mirror the CSS custom properties in globals.css for use in
 * JS contexts (charts, dynamic styles, Canvas, etc.).
 */

export const colors = {
  /** AFENDA brand blue scale (matches `--color-brand-*` in globals.css). */
  brand: {
    50: "#E8F0F8",
    100: "#C5D9EE",
    200: "#9EBFE2",
    300: "#7AA7D6",
    400: "#5B91CA",
    500: "#005EB8",
    600: "#004E9A",
    700: "#003A70",
    800: "#002952",
    900: "#001A34",
    950: "#000F1F",
  },
  neutral: {
    50: "#F8F9FA",
    100: "#F1F3F5",
    200: "#E9ECEF",
    300: "#DEE2E6",
    400: "#ADB5BD",
    500: "#6C757D",
    600: "#495057",
    700: "#343A40",
    800: "#212529",
    900: "#1A1A2E",
    950: "#0F0F1A",
  },
  gold: {
    DEFAULT: "#D4A843",
    light: "#F0DBA8",
    dark: "#A07D2E",
  },
  status: {
    success: "#2E7D32",
    warning: "#F57C00",
    error: "#C62828",
    info: "#0277BD",
  },
} as const;

export const moduleColors = {
  core: "#3B62B5",
  security: "#7C4DBA",
  audit: "#6B7C8D",
  hr: "#1A9D6E",
  payroll: "#E59400",
  benefits: "#C74B8A",
  talent: "#0C97AA",
  learning: "#17927D",
  recruitment: "#E06528",
} as const;

export type ModuleCode = keyof typeof moduleColors;

export const getModuleColor = (moduleCode: ModuleCode): string => {
  return moduleColors[moduleCode];
};

export type ColorScale = typeof colors;

export const shadows = {
  xs: "0 1px 2px rgba(0,0,0,0.05)",
  sm: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  md: "0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.04)",
  lg: "0 12px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.04)",
  xl: "0 24px 48px rgba(0,0,0,0.14), 0 8px 16px rgba(0,0,0,0.06)",
} as const;

export const spacing = {
  0: "0px",
  0.5: "2px",
  1: "4px",
  1.5: "6px",
  2: "8px",
  2.5: "10px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
} as const;

export const motion = {
  duration: {
    fast: "100ms",
    normal: "200ms",
    slow: "300ms",
  },
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

export const typography = {
  fontFamily: {
    sans: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: '"Source Serif 4", "Georgia", "Cambria", "Times New Roman", serif',
    mono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
  },
  scale: {
    display: { size: "2.5rem", weight: 700, tracking: "-0.02em" },
    h1: { size: "2rem", weight: 700, tracking: "-0.015em" },
    h2: { size: "1.5rem", weight: 600, tracking: "-0.01em" },
    h3: { size: "1.25rem", weight: 600, tracking: "0" },
    h4: { size: "1rem", weight: 600, tracking: "0" },
    body: { size: "0.875rem", weight: 400, tracking: "0" },
    bodySm: { size: "0.8125rem", weight: 400, tracking: "0" },
    caption: { size: "0.75rem", weight: 400, tracking: "0.01em" },
    overline: { size: "0.6875rem", weight: 600, tracking: "0.08em" },
  },
} as const;

export const zIndex = {
  dropdown: 50,
  sticky: 100,
  modal: 200,
  popover: 300,
  toast: 400,
  max: 9999,
} as const;
