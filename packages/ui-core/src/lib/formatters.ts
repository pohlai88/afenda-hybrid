/**
 * AFENDA Design System — Formatters
 *
 * Locale-aware number, currency, date, and text formatting.
 * Presentation principle: "round sensibly" — readers don't need
 * two decimal places.
 */

export function formatNumber(
  value: number,
  options?: {
    locale?: string;
    decimals?: number;
    compact?: boolean;
  }
): string {
  const { locale = "en-US", decimals, compact = false } = options ?? {};

  if (compact) {
    return new Intl.NumberFormat(locale, {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: decimals ?? 1,
    }).format(value);
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrency(
  value: number,
  options?: {
    locale?: string;
    currency?: string;
    compact?: boolean;
  }
): string {
  const { locale = "en-US", currency = "USD", compact = false } = options ?? {};

  if (compact) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(value);
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(
  date: Date | string | number,
  options?: {
    locale?: string;
    format?: "short" | "medium" | "long" | "relative";
  }
): string {
  const { locale = "en-US", format = "medium" } = options ?? {};
  const d = date instanceof Date ? date : new Date(date);

  if (format === "relative") {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const diff = d.getTime() - Date.now();
    const absDiff = Math.abs(diff);

    if (absDiff < 60_000) return rtf.format(Math.round(diff / 1000), "second");
    if (absDiff < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minute");
    if (absDiff < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), "hour");
    if (absDiff < 2_592_000_000) return rtf.format(Math.round(diff / 86_400_000), "day");
    return rtf.format(Math.round(diff / 2_592_000_000), "month");
  }

  const formatMap: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: "numeric", day: "numeric", year: "2-digit" },
    medium: { month: "short", day: "numeric", year: "numeric" },
    long: {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  };

  return new Intl.DateTimeFormat(locale, formatMap[format]).format(d);
}

export function formatPercent(
  value: number,
  options?: {
    locale?: string;
    decimals?: number;
  }
): string {
  const { locale = "en-US", decimals = 1 } = options ?? {};
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}
