import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { COMMAND_SURFACE_SELECTION_NOTICE } from "../patterns/command-surface-toolbar";
import { BulkSelectionNotice } from "../patterns/bulk-selection-notice";

describe("BulkSelectionNotice", () => {
  describe("rendering", () => {
    it("renders selection count", () => {
      render(
        <BulkSelectionNotice
          selectedOnPage={5}
          totalOnPage={10}
          totalFiltered={50}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
        />
      );
      expect(screen.getByText("selected")).toBeInTheDocument();
    });

    it("tags escalation strip with data-afenda-command-surface", () => {
      render(
        <BulkSelectionNotice
          selectedOnPage={2}
          totalOnPage={10}
          totalFiltered={50}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
        />
      );
      expect(screen.getByRole("status")).toHaveAttribute(
        "data-afenda-command-surface",
        COMMAND_SURFACE_SELECTION_NOTICE
      );
    });

    it("returns null when selectedOnPage is 0", () => {
      const { container } = render(
        <BulkSelectionNotice
          selectedOnPage={0}
          totalOnPage={10}
          totalFiltered={50}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("escalation links", () => {
    it("shows 'Select all on page' when partial page selection", () => {
      render(
        <BulkSelectionNotice
          selectedOnPage={5}
          totalOnPage={10}
          totalFiltered={50}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
        />
      );
      expect(screen.getByText(/Select all 10 on this page/)).toBeInTheDocument();
    });

    it("hides 'Select all on page' when all page items selected", () => {
      render(
        <BulkSelectionNotice
          selectedOnPage={10}
          totalOnPage={10}
          totalFiltered={50}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
        />
      );
      expect(screen.queryByText(/Select all.*on this page/)).not.toBeInTheDocument();
    });

    it("shows 'Select all filtered' when totalFiltered > totalOnPage", () => {
      render(
        <BulkSelectionNotice
          selectedOnPage={10}
          totalOnPage={10}
          totalFiltered={50}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
        />
      );
      expect(screen.getByText(/Select all 50 matching filter/)).toBeInTheDocument();
    });

    it("hides 'Select all filtered' when totalFiltered equals totalOnPage", () => {
      render(
        <BulkSelectionNotice
          selectedOnPage={5}
          totalOnPage={10}
          totalFiltered={10}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
        />
      );
      expect(screen.queryByText(/matching filter/)).not.toBeInTheDocument();
    });

    it("shows both links when appropriate", () => {
      render(
        <BulkSelectionNotice
          selectedOnPage={5}
          totalOnPage={10}
          totalFiltered={100}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
        />
      );
      expect(screen.getByText(/Select all 10 on this page/)).toBeInTheDocument();
      expect(screen.getByText(/Select all 100 matching filter/)).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onSelectAllPage when page link clicked", async () => {
      const user = userEvent.setup();
      const onSelectAllPage = vi.fn();
      render(
        <BulkSelectionNotice
          selectedOnPage={5}
          totalOnPage={10}
          totalFiltered={50}
          onSelectAllPage={onSelectAllPage}
          onSelectAllFiltered={() => {}}
        />
      );

      await user.click(screen.getByText(/Select all 10 on this page/));
      expect(onSelectAllPage).toHaveBeenCalledTimes(1);
    });

    it("calls onSelectAllFiltered when filtered link clicked", async () => {
      const user = userEvent.setup();
      const onSelectAllFiltered = vi.fn();
      render(
        <BulkSelectionNotice
          selectedOnPage={10}
          totalOnPage={10}
          totalFiltered={100}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={onSelectAllFiltered}
        />
      );

      await user.click(screen.getByText(/Select all 100 matching filter/));
      expect(onSelectAllFiltered).toHaveBeenCalledTimes(1);
    });
  });

  describe("accessibility", () => {
    it("has live region attributes", () => {
      const { container } = render(
        <BulkSelectionNotice
          selectedOnPage={5}
          totalOnPage={10}
          totalFiltered={50}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
        />
      );
      const notice = container.querySelector('[role="status"]');
      expect(notice).toHaveAttribute("aria-live", "polite");
      expect(notice).toHaveAttribute("aria-atomic", "true");
    });

    it("announces bulk escalation context for screen readers", () => {
      render(
        <BulkSelectionNotice
          selectedOnPage={5}
          totalOnPage={10}
          totalFiltered={50}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
        />
      );
      expect(
        screen.getByText(/Bulk selection\. Links below can expand the selection/i)
      ).toBeInTheDocument();
    });

    it("has type=button on action links", () => {
      render(
        <BulkSelectionNotice
          selectedOnPage={5}
          totalOnPage={10}
          totalFiltered={50}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
        />
      );
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("type", "button");
      });
    });
  });

  describe("visual styling", () => {
    it("uses muted background", () => {
      const { container } = render(
        <BulkSelectionNotice
          selectedOnPage={5}
          totalOnPage={10}
          totalFiltered={50}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
        />
      );
      const notice = container.querySelector(".bg-muted\\/40");
      expect(notice).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(
        <BulkSelectionNotice
          selectedOnPage={5}
          totalOnPage={10}
          totalFiltered={50}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
          className="custom-class"
        />
      );
      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles single item selection", () => {
      render(
        <BulkSelectionNotice
          selectedOnPage={1}
          totalOnPage={10}
          totalFiltered={50}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
        />
      );
      expect(screen.getByText("selected")).toBeInTheDocument();
    });

    it("handles full page selection", () => {
      render(
        <BulkSelectionNotice
          selectedOnPage={10}
          totalOnPage={10}
          totalFiltered={10}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
        />
      );
      expect(screen.getByText("selected")).toBeInTheDocument();
    });

    it("handles large numbers", () => {
      render(
        <BulkSelectionNotice
          selectedOnPage={100}
          totalOnPage={100}
          totalFiltered={10000}
          onSelectAllPage={() => {}}
          onSelectAllFiltered={() => {}}
        />
      );
      expect(screen.getByText(/Select all 10000 matching filter/)).toBeInTheDocument();
    });
  });
});
