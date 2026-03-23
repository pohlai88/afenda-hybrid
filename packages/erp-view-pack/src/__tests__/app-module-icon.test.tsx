import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { AppModuleIcon } from "../patterns/app-module-icon";

describe("AppModuleIcon", () => {
  it("renders an svg for a valid Lucide icon name", () => {
    const { container } = render(<AppModuleIcon iconName="Users" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("falls back to HelpCircle markup when iconName is not a Lucide icon", () => {
    const { container: valid } = render(<AppModuleIcon iconName="Users" />);
    const { container: fallback } = render(<AppModuleIcon iconName="NotARealLucideIcon" />);
    expect(fallback.querySelector("svg")).toBeInTheDocument();
    expect(fallback.innerHTML).not.toBe(valid.innerHTML);
  });

  it("falls back when iconName is empty", () => {
    const { container: users } = render(<AppModuleIcon iconName="Users" />);
    const { container: empty } = render(<AppModuleIcon iconName="" />);
    expect(empty.querySelector("svg")).toBeInTheDocument();
    expect(empty.innerHTML).not.toBe(users.innerHTML);
  });

  it("applies className to the svg", () => {
    const { container } = render(<AppModuleIcon iconName="Users" className="text-primary" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute("class")).toMatch(/text-primary/);
  });

  it("sets width and height from size", () => {
    const { container } = render(<AppModuleIcon iconName="Users" size={28} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "28");
    expect(svg).toHaveAttribute("height", "28");
  });

  it("defaults size to 20", () => {
    const { container } = render(<AppModuleIcon iconName="Users" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "20");
    expect(svg).toHaveAttribute("height", "20");
  });
});
