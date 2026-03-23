import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DescriptionList } from "../patterns/description-list";

const sampleItems = [
  { label: "Name", value: "Acme Corp" },
  { label: "Status", value: "Active" },
];

describe("DescriptionList", () => {
  it("renders a semantic description list with dt/dd pairs", () => {
    render(<DescriptionList items={sampleItems} />);
    const dl = document.querySelector("dl");
    expect(dl).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    const dts = dl!.querySelectorAll("dt");
    const dds = dl!.querySelectorAll("dd");
    expect(dts).toHaveLength(2);
    expect(dds).toHaveLength(2);
  });

  it("renders em dash for empty value", () => {
    render(<DescriptionList items={[{ label: "Empty", value: null }]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  describe("column layout", () => {
    it("uses single column grid when columns=1", () => {
      const { container } = render(<DescriptionList items={sampleItems} columns={1} />);
      const dl = container.querySelector("dl");
      expect(dl).toHaveClass("grid-cols-1");
      expect(dl).not.toHaveClass("sm:grid-cols-2");
    });

    it("uses responsive two-column grid when columns=2 (default)", () => {
      const { container } = render(<DescriptionList items={sampleItems} />);
      const dl = container.querySelector("dl");
      expect(dl).toHaveClass("grid-cols-1", "sm:grid-cols-2");
    });

    it("uses responsive three-column grid when columns=3", () => {
      const { container } = render(<DescriptionList items={sampleItems} columns={3} />);
      const dl = container.querySelector("dl");
      expect(dl).toHaveClass("grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3");
    });
  });

  it("merges className onto the list", () => {
    const { container } = render(<DescriptionList items={sampleItems} className="my-dl" />);
    expect(container.querySelector("dl")).toHaveClass("my-dl");
  });

  it("supports ReactNode values", () => {
    render(<DescriptionList items={[{ label: "Note", value: <strong>Bold</strong> }]} />);
    expect(screen.getByText("Bold")).toBeInTheDocument();
    expect(screen.getByText("Bold").tagName).toBe("STRONG");
  });

  it("applies audit identifier tone when valueTone is identifier", () => {
    const { container } = render(
      <DescriptionList
        items={[{ label: "Record ID", value: "inv-2024-001", valueTone: "identifier" }]}
      />
    );
    const dd = container.querySelector("dd");
    expect(dd).toHaveClass("font-mono");
  });

  it("applies audit timestamp tone when valueTone is timestamp", () => {
    const { container } = render(
      <DescriptionList
        items={[
          {
            label: "Occurred at",
            value: "2024-03-20 14:32:01",
            valueTone: "timestamp",
          },
        ]}
      />
    );
    const dd = container.querySelector("dd");
    expect(dd).toHaveClass("tabular-nums");
  });

  it("applies audit actor tone when valueTone is actor", () => {
    const { container } = render(
      <DescriptionList items={[{ label: "Actor", value: "Jane Admin", valueTone: "actor" }]} />
    );
    const dd = container.querySelector("dd");
    expect(dd).toHaveClass("font-medium");
  });
});
