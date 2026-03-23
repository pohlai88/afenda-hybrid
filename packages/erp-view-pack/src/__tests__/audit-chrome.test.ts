import { describe, expect, it } from "vitest";
import {
  AUDIT_FIELD_DIFF_AFTER,
  AUDIT_FIELD_DIFF_BEFORE,
  AUDIT_SURFACE_READONLY,
  AUDIT_TEXT_ACTOR,
  AUDIT_TEXT_IDENTIFIER,
  AUDIT_TEXT_TIMESTAMP,
} from "../patterns/audit-chrome";

describe("audit-chrome (Audit & Traceability UX Standard)", () => {
  it("uses monospace for identifiers (§8.3)", () => {
    expect(AUDIT_TEXT_IDENTIFIER).toContain("font-mono");
  });

  it("uses tabular numerals for timestamps (§8.3)", () => {
    expect(AUDIT_TEXT_TIMESTAMP).toContain("tabular-nums");
  });

  it("uses medium weight for actors (§8.3)", () => {
    expect(AUDIT_TEXT_ACTOR).toContain("font-medium");
  });

  it("styles diff before as muted with strike (§6.1)", () => {
    expect(AUDIT_FIELD_DIFF_BEFORE).toContain("line-through");
    expect(AUDIT_FIELD_DIFF_BEFORE).toContain("text-muted-foreground");
  });

  it("styles diff after as emphasized (§6.1)", () => {
    expect(AUDIT_FIELD_DIFF_AFTER).toContain("font-medium");
    expect(AUDIT_FIELD_DIFF_AFTER).toContain("text-foreground");
  });

  it("uses neutral read-only surface (§8.1)", () => {
    expect(AUDIT_SURFACE_READONLY).toContain("border");
    expect(AUDIT_SURFACE_READONLY).toContain("rounded-md");
  });
});
