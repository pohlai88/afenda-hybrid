import { describe, expect, it } from "vitest";
import { ERP_PACK_RENDERING_LAYER } from "../patterns/metadata-rendering-layer";

describe("metadata-rendering-layer", () => {
  it("exposes a stable rendering-layer tag for diagnostics", () => {
    expect(ERP_PACK_RENDERING_LAYER).toBe("metadata-driven-v1");
  });
});
