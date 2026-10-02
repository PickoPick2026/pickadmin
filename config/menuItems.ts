import {
  LayoutDashboard,
  Layers,
  ClipboardList,
  Calculator,
  ShoppingBag,
  PackageCheck,
  SquareKanban,
  Settings,
  Trash2,
  Users,
} from "lucide-react";

/**
 * Every entry maps to a real page in the admin. The sidebar renders this list
 * filtered by the signed-in user's permissions (see Sidenav.tsx).
 *
 * Note: Category lives inside Product (Manage Categories) and Admin Users
 * lives inside Admin Settings — neither gets a sidebar entry.
 */
export const menuItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "product",
    label: "Product",
    href: "/product",
    icon: Layers,
  },
  {
    key: "customer",
    label: "Customer List",
    href: "/customer",
    icon: Users,
  },
  {
    key: "kanban",
    label: "Pipeline",
    href: "/kanban",
    icon: SquareKanban,
  },
  {
    key: "services",
    label: "Service Requests",
    href: "/services",
    icon: PackageCheck,
  },
  {
    key: "quotes",
    label: "Quote Requests",
    href: "/quotes",
    icon: ShoppingBag,
  },
  {
    key: "nri",
    label: "NRI Requests",
    href: "/nri",
    icon: ClipboardList,
  },
  {
    key: "estimates",
    label: "Estimate Leads",
    href: "/estimates",
    icon: Calculator,
  },
  {
    key: "admin_settings",
    label: "Admin Settings",
    href: "/setting",
    icon: Settings,
  },
];

/**
 * Features that can be granted per user via checkboxes on the user form.
 * Sidebar pages plus the special "Delete Leads" ability (not a page).
 */
export const assignableFeatures = [
  ...menuItems.filter((item) => item.key !== "dashboard"),
  { key: "delete_leads", label: "Delete Leads", icon: Trash2 },
];

/** Fallback permissions used when a user has no stored permissions yet. */
export const defaultPermissions: Record<string, string[]> = {
  SUPER_ADMIN: menuItems.map((item) => item.key),
  ADMIN: [
    "dashboard",
    "product",
    "customer",
    "kanban",
    "services",
    "quotes",
    "nri",
    "estimates",
  ],
  STAFF: ["dashboard"],
};
