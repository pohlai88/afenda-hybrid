import type { AppModule, MenuItem } from "../patterns/sidebar-nav";
import type { Column } from "../patterns/data-table";

export const mockMenuItems: MenuItem[] = [
  {
    menuItemId: 1,
    code: "org-list",
    label: "Organizations",
    icon: "Building2",
    routePath: "/core/organizations",
    sortOrder: 1,
  },
  {
    menuItemId: 2,
    code: "loc-list",
    label: "Locations",
    icon: "MapPin",
    routePath: "/core/locations",
    sortOrder: 2,
  },
  {
    menuItemId: 3,
    code: "wf-list",
    label: "Workflows",
    icon: "GitBranch",
    routePath: "/core/workflows",
    sortOrder: 3,
  },
];

const mockHrMenuItems: MenuItem[] = [
  {
    menuItemId: 10,
    code: "emp-list",
    label: "Employees",
    icon: "Users",
    routePath: "/hr/employees",
    sortOrder: 1,
  },
  {
    menuItemId: 11,
    code: "dept-list",
    label: "Departments",
    icon: "Network",
    routePath: "/hr/departments",
    sortOrder: 2,
  },
  {
    menuItemId: 12,
    code: "leave-list",
    label: "Leave Requests",
    icon: "CalendarOff",
    routePath: "/hr/leave-requests",
    sortOrder: 3,
    badgeCount: 5,
  },
];

const mockRecruitmentMenuItems: MenuItem[] = [
  {
    menuItemId: 20,
    code: "req-list",
    label: "Job Requisitions",
    icon: "Briefcase",
    routePath: "/recruitment/requisitions",
    sortOrder: 1,
  },
  {
    menuItemId: 21,
    code: "app-list",
    label: "Applications",
    icon: "FileText",
    routePath: "/recruitment/applications",
    sortOrder: 2,
    badgeCount: 12,
  },
];

export const mockAppModules: AppModule[] = [
  {
    appModuleId: 1,
    code: "core",
    name: "Core",
    icon: "Settings",
    color: "#6366f1",
    basePath: "/core",
    sortOrder: 1,
    menuItems: mockMenuItems,
  },
  {
    appModuleId: 2,
    code: "hr",
    name: "Human Resources",
    icon: "Users",
    color: "#10b981",
    basePath: "/hr",
    sortOrder: 2,
    menuItems: mockHrMenuItems,
  },
  {
    appModuleId: 3,
    code: "recruitment",
    name: "Recruitment",
    icon: "Briefcase",
    color: "#f97316",
    basePath: "/recruitment",
    sortOrder: 3,
    menuItems: mockRecruitmentMenuItems,
  },
];

export interface MockEmployee {
  [key: string]: unknown;
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string;
  status: string;
  joinDate: string;
}

export const mockEmployeeData: MockEmployee[] = [
  {
    id: 1,
    employeeCode: "EMP-001",
    firstName: "Alice",
    lastName: "Johnson",
    department: "Engineering",
    status: "Active",
    joinDate: "2024-01-15",
  },
  {
    id: 2,
    employeeCode: "EMP-002",
    firstName: "Bob",
    lastName: "Smith",
    department: "Marketing",
    status: "Active",
    joinDate: "2024-02-20",
  },
  {
    id: 3,
    employeeCode: "EMP-003",
    firstName: "Carol",
    lastName: "Williams",
    department: "Finance",
    status: "On Leave",
    joinDate: "2023-06-10",
  },
  {
    id: 4,
    employeeCode: "EMP-004",
    firstName: "David",
    lastName: "Brown",
    department: "Engineering",
    status: "Active",
    joinDate: "2023-11-05",
  },
  {
    id: 5,
    employeeCode: "EMP-005",
    firstName: "Eve",
    lastName: "Davis",
    department: "Human Resources",
    status: "Terminated",
    joinDate: "2022-09-01",
  },
  {
    id: 6,
    employeeCode: "EMP-006",
    firstName: "Frank",
    lastName: "Miller",
    department: "Sales",
    status: "Active",
    joinDate: "2024-03-12",
  },
  {
    id: 7,
    employeeCode: "EMP-007",
    firstName: "Grace",
    lastName: "Wilson",
    department: "Engineering",
    status: "Active",
    joinDate: "2024-04-01",
  },
  {
    id: 8,
    employeeCode: "EMP-008",
    firstName: "Henry",
    lastName: "Moore",
    department: "Finance",
    status: "Active",
    joinDate: "2023-08-22",
  },
  {
    id: 9,
    employeeCode: "EMP-009",
    firstName: "Irene",
    lastName: "Taylor",
    department: "Marketing",
    status: "On Leave",
    joinDate: "2024-01-30",
  },
  {
    id: 10,
    employeeCode: "EMP-010",
    firstName: "Jack",
    lastName: "Anderson",
    department: "Sales",
    status: "Active",
    joinDate: "2023-12-01",
  },
  {
    id: 11,
    employeeCode: "EMP-011",
    firstName: "Karen",
    lastName: "Thomas",
    department: "Engineering",
    status: "Active",
    joinDate: "2024-05-15",
  },
  {
    id: 12,
    employeeCode: "EMP-012",
    firstName: "Leo",
    lastName: "Martinez",
    department: "Human Resources",
    status: "Active",
    joinDate: "2024-06-01",
  },
];

export const mockEmployeeColumns: Column<MockEmployee>[] = [
  {
    id: "employeeCode",
    header: "Code",
    accessorKey: "employeeCode",
    sortable: true,
    filterable: true,
  },
  {
    id: "firstName",
    header: "First Name",
    accessorKey: "firstName",
    sortable: true,
    filterable: true,
  },
  { id: "lastName", header: "Last Name", accessorKey: "lastName", sortable: true },
  {
    id: "department",
    header: "Department",
    accessorKey: "department",
    sortable: true,
    filterable: true,
  },
  { id: "status", header: "Status", accessorKey: "status", sortable: true },
  { id: "joinDate", header: "Join Date", accessorKey: "joinDate", sortable: true },
];
