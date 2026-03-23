import { describe, expect, it } from "vitest";
import {
  ERP_SPACE_PAD_MD,
  ERP_TYPO_BODY,
  ERP_TYPO_DISPLAY,
  ERP_TYPO_EMPHASIS,
  ERP_TYPO_KPI_VALUE,
  ERP_TYPO_META,
  ERP_TYPO_META_STRONG,
  ERP_TYPO_MICRO,
  ERP_TYPO_OVERLINE_LABEL,
  ERP_TYPO_SECTION,
  ERP_TYPO_SIZE_BODY,
  ERP_TYPO_SIZE_COMPACT,
} from "../patterns/erp-typography";

describe("erp-typography (Visual Density & Typography Standard)", () => {
  it("maps display role to semibold 2xl (§4.2)", () => {
    expect(ERP_TYPO_DISPLAY).toContain("text-2xl");
    expect(ERP_TYPO_DISPLAY).toContain("font-semibold");
  });

  it("KPI value uses display font and tabular numerals (§4.2–4.3)", () => {
    expect(ERP_TYPO_KPI_VALUE).toContain("font-display");
    expect(ERP_TYPO_KPI_VALUE).toContain("tabular-nums");
    expect(ERP_TYPO_KPI_VALUE).toContain("font-semibold");
  });

  it("section role uses base semibold (§4.2)", () => {
    expect(ERP_TYPO_SECTION).toContain("text-base");
    expect(ERP_TYPO_SECTION).toContain("font-semibold");
  });

  it("emphasis and body differ by weight (§4.2)", () => {
    expect(ERP_TYPO_EMPHASIS).toContain("font-medium");
    expect(ERP_TYPO_BODY).toContain("font-normal");
  });

  it("meta is 12px regular; micro is 11px medium (§4.2)", () => {
    expect(ERP_TYPO_META).toContain("text-xs");
    expect(ERP_TYPO_MICRO).toContain("text-[11px]");
    expect(ERP_TYPO_MICRO).toContain("font-medium");
  });

  it("overline labels stay muted uppercase (§5, §9.1)", () => {
    expect(ERP_TYPO_OVERLINE_LABEL).toContain("uppercase");
    expect(ERP_TYPO_OVERLINE_LABEL).toContain("text-muted-foreground");
  });

  it("meta-strong matches dense chip styling (§4.2)", () => {
    expect(ERP_TYPO_META_STRONG).toContain("text-xs");
    expect(ERP_TYPO_META_STRONG).toContain("font-medium");
  });

  it("exposes size helpers for nested semibold components", () => {
    expect(ERP_TYPO_SIZE_BODY).toBe("text-sm");
    expect(ERP_TYPO_SIZE_COMPACT).toBe("text-xs");
  });

  it("spacing pad MD maps to 12px token (§3.2)", () => {
    expect(ERP_SPACE_PAD_MD).toBe("p-3");
  });
});
