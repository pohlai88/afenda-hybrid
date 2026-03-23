import { beforeEach, describe, expect, it, vi } from "vitest";

const { toastMock, successMock, warningMock, errorMock } = vi.hoisted(() => {
  const toastMock = vi.fn();
  const successMock = vi.fn();
  const warningMock = vi.fn();
  const errorMock = vi.fn();
  return { toastMock, successMock, warningMock, errorMock };
});

vi.mock("@afenda/ui-core/primitives/toast", () => ({
  toast: Object.assign(toastMock, {
    success: successMock,
    warning: warningMock,
    error: errorMock,
  }),
}));

import { showFeedback } from "../patterns/feedback-toast";

describe("feedback-toast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dispatches neutral via toast()", () => {
    showFeedback("neutral", "Saved");
    expect(toastMock).toHaveBeenCalledWith("Saved");
    expect(successMock).not.toHaveBeenCalled();
  });

  it("dispatches neutral with description", () => {
    showFeedback("neutral", "Done", { description: "Details" });
    expect(toastMock).toHaveBeenCalledWith("Done", { description: "Details" });
  });

  it("dispatches success, warning, error", () => {
    showFeedback("success", "OK", { description: "x" });
    expect(successMock).toHaveBeenCalledWith("OK", { description: "x" });

    showFeedback("warning", "Careful");
    expect(warningMock).toHaveBeenCalledWith("Careful", undefined);

    showFeedback("error", "Fail");
    expect(errorMock).toHaveBeenCalledWith("Fail", undefined);
  });
});
