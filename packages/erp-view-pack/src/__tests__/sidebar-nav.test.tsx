import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarNav } from "../patterns/sidebar-nav";
import type { AppModule } from "../patterns/sidebar-nav";

const mockModules: AppModule[] = [
  {
    appModuleId: 1,
    code: "hr",
    name: "Human Resources",
    icon: "Users",
    color: "#3b82f6",
    basePath: "/hr",
    sortOrder: 1,
    menuItems: [
      {
        menuItemId: 10,
        code: "employees",
        label: "Employees",
        icon: "User",
        routePath: "/hr/employees",
        sortOrder: 1,
      },
      {
        menuItemId: 11,
        code: "attendance",
        label: "Attendance",
        routePath: "/hr/attendance",
        sortOrder: 2,
        badgeCount: 3,
      },
    ],
  },
  {
    appModuleId: 2,
    code: "sales",
    name: "Sales",
    icon: "ShoppingCart",
    color: "#10b981",
    basePath: "/sales",
    sortOrder: 2,
    menuItems: [
      {
        menuItemId: 20,
        code: "orders",
        label: "Orders",
        routePath: "/sales/orders",
        sortOrder: 1,
      },
    ],
  },
];

describe("SidebarNav", () => {
  describe("rendering", () => {
    it("renders all modules", () => {
      render(<SidebarNav modules={mockModules} />);
      expect(screen.getByText("Human Resources")).toBeInTheDocument();
      expect(screen.getByText("Sales")).toBeInTheDocument();
    });

    it("renders search input when not collapsed", () => {
      render(<SidebarNav modules={mockModules} />);
      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });

    it("does not render search when collapsed", () => {
      render(<SidebarNav modules={mockModules} isCollapsed />);
      expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
    });

    it("renders badge count when provided", async () => {
      const user = userEvent.setup();
      render(<SidebarNav modules={mockModules} />);

      const hrToggle = screen.getByRole("button", { name: /human resources/i });
      await user.click(hrToggle);

      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  describe("module expansion", () => {
    it("expands module when toggle clicked", async () => {
      const user = userEvent.setup();
      render(<SidebarNav modules={mockModules} />);

      const hrToggle = screen.getByRole("button", { name: /human resources/i });
      expect(hrToggle).toHaveAttribute("aria-expanded", "false");

      await user.click(hrToggle);
      expect(hrToggle).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Employees")).toBeInTheDocument();
    });

    it("collapses module when toggle clicked again", async () => {
      const user = userEvent.setup();
      render(<SidebarNav modules={mockModules} />);

      const hrToggle = screen.getByRole("button", { name: /human resources/i });
      await user.click(hrToggle);
      await user.click(hrToggle);

      expect(hrToggle).toHaveAttribute("aria-expanded", "false");
    });

    it("auto-expands module with active route", () => {
      render(<SidebarNav modules={mockModules} currentPath="/hr/employees" />);
      const hrToggle = screen.getByRole("button", { name: /human resources/i });
      expect(hrToggle).toHaveAttribute("aria-expanded", "true");
    });

    it("has aria-controls pointing to menu container", async () => {
      const user = userEvent.setup();
      const { container } = render(<SidebarNav modules={mockModules} />);

      const hrToggle = screen.getByRole("button", { name: /human resources/i });
      const controlsId = hrToggle.getAttribute("aria-controls");
      expect(controlsId).toBeTruthy();

      await user.click(hrToggle);
      const menu = container.querySelector(`#${controlsId}`);
      expect(menu).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("calls onNavigate when menu item clicked", async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();
      render(<SidebarNav modules={mockModules} onNavigate={onNavigate} />);

      const hrToggle = screen.getByRole("button", { name: /human resources/i });
      await user.click(hrToggle);

      await user.click(screen.getByText("Employees"));
      expect(onNavigate).toHaveBeenCalledWith("/hr/employees");
    });

    it("highlights active menu item", () => {
      render(<SidebarNav modules={mockModules} currentPath="/hr/employees" />);
      const employeesButton = screen.getByText("Employees").closest("button");
      expect(employeesButton?.className).toContain("bg-primary/10");
      expect(employeesButton?.className).toContain("text-primary");
    });
  });

  describe("search functionality", () => {
    it("filters menu items by label", async () => {
      const user = userEvent.setup();
      render(<SidebarNav modules={mockModules} />);

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "employees");

      expect(screen.getByText("Human Resources")).toBeInTheDocument();
      expect(screen.queryByText("Sales")).not.toBeInTheDocument();
    });

    it("filters by module name", async () => {
      const user = userEvent.setup();
      render(<SidebarNav modules={mockModules} />);

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "sales");

      expect(screen.getByText("Sales")).toBeInTheDocument();
      expect(screen.queryByText("Human Resources")).not.toBeInTheDocument();
    });

    it("shows no results when search has no matches", async () => {
      const user = userEvent.setup();
      render(<SidebarNav modules={mockModules} />);

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "nonexistent");

      expect(screen.queryByText("Human Resources")).not.toBeInTheDocument();
      expect(screen.queryByText("Sales")).not.toBeInTheDocument();
    });
  });

  describe("collapsed mode", () => {
    it("shows only module icons when collapsed", () => {
      render(<SidebarNav modules={mockModules} isCollapsed />);
      expect(screen.queryByText("Human Resources")).not.toBeInTheDocument();
      expect(screen.queryByText("Sales")).not.toBeInTheDocument();
    });

    it("navigates to first menu item when module icon clicked in collapsed mode", async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();
      render(<SidebarNav modules={mockModules} isCollapsed onNavigate={onNavigate} />);

      const hrButton = screen.getByRole("button", { name: "Human Resources" });
      await user.click(hrButton);

      expect(onNavigate).toHaveBeenCalledWith("/hr/employees");
    });

    it("shows tooltip on hover in collapsed mode", () => {
      render(<SidebarNav modules={mockModules} isCollapsed />);
      const hrButton = screen.getByRole("button", { name: "Human Resources" });
      expect(hrButton).toHaveAttribute("aria-label", "Human Resources");
    });
  });

  describe("accessibility", () => {
    it("has navigation landmark", () => {
      const { container } = render(<SidebarNav modules={mockModules} />);
      const nav = container.querySelector('nav[aria-label="Application modules"]');
      expect(nav).toBeInTheDocument();
    });

    it("exposes cross-module navigation conformance attrs", () => {
      const { container } = render(
        <SidebarNav modules={mockModules} currentPath="/hr/employees" />
      );
      expect(container.querySelector('[data-afenda-nav-surface="sidebar-rail"]')).toBeTruthy();
      expect(
        container.querySelectorAll('[data-afenda-nav-surface="module-group"]').length
      ).toBeGreaterThan(0);
      const activeItem = container.querySelector('[data-afenda-nav-surface="menu-item-active"]');
      expect(activeItem?.textContent).toContain("Employees");
    });

    it("exposes menu-item-active on collapsed module when route matches", () => {
      const { container } = render(
        <SidebarNav modules={mockModules} isCollapsed currentPath="/hr/employees" />
      );
      expect(container.querySelector('[data-afenda-nav-surface="menu-item-active"]')).toBeTruthy();
    });

    it("has aria-label on search input", () => {
      render(<SidebarNav modules={mockModules} />);
      const searchInput = screen.getByPlaceholderText("Search...");
      expect(searchInput).toHaveAttribute("aria-label", "Search navigation");
    });

    it("marks decorative icons as aria-hidden", () => {
      const { container } = render(<SidebarNav modules={mockModules} />);
      const ariaHiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(ariaHiddenElements.length).toBeGreaterThan(0);
    });

    it("has type=button on all interactive buttons", async () => {
      const user = userEvent.setup();
      render(<SidebarNav modules={mockModules} />);

      const hrToggle = screen.getByRole("button", { name: /human resources/i });
      expect(hrToggle).toHaveAttribute("type", "button");

      await user.click(hrToggle);
      const employeesButton = screen.getByText("Employees").closest("button");
      expect(employeesButton).toHaveAttribute("type", "button");
    });
  });

  describe("sorting", () => {
    it("sorts modules by sortOrder", () => {
      const { container } = render(<SidebarNav modules={mockModules} />);
      const moduleButtons = container.querySelectorAll("[aria-expanded]");
      const firstModule = moduleButtons[0];
      expect(firstModule.textContent).toContain("Human Resources");
    });
  });
});
