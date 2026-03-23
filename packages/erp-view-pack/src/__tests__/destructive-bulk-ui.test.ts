import { describe, expect, it } from "vitest";
import {
  DESTRUCTIVE_CONFIRM_LABEL_DELETE_PERMANENTLY,
  resolveBulkDestructiveSeverity,
} from "../patterns/destructive-bulk-ui";

describe("destructive-bulk-ui", () => {
  it("resolveBulkDestructiveSeverity returns undefined when not destructive", () => {
    expect(resolveBulkDestructiveSeverity(false, "high")).toBeUndefined();
    expect(resolveBulkDestructiveSeverity(undefined, "high")).toBeUndefined();
  });

  it("defaults to medium when destructive and severity omitted", () => {
    expect(resolveBulkDestructiveSeverity(true, undefined)).toBe("medium");
  });

  it("preserves explicit severity", () => {
    expect(resolveBulkDestructiveSeverity(true, "critical")).toBe("critical");
  });

  it("exposes standard confirm label for delete", () => {
    expect(DESTRUCTIVE_CONFIRM_LABEL_DELETE_PERMANENTLY).toBe("Delete permanently");
  });
});
