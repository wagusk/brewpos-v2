// Admin workspace menu schema: section -> items -> optional 3rd-level "detail"
// (e.g. report period). Defined in one place so the orchestrator and tests
// share the same structure.

export type AdminMenuItem = {
  id: string;
  label: string;
  path: string;
  third?: { id: string; label: string }[];
};

export type AdminMenuSection = {
  id: string;
  label: string;
  description: string;
  items: AdminMenuItem[];
};

// Resolve the detail-id to use when an item becomes active. Items without a
// 3rd-level menu fall back to "default" so the detail pane always renders.
export function pickFirstDetailId(item: AdminMenuItem): string {
  return item.third?.[0]?.id ?? "default";
}

export const ADMIN_MENU: AdminMenuSection[] = [
  {
    id: "catalog",
    label: "Catalog",
    description: "Products and menu structure",
    items: [
      { id: "products", label: "Products", path: "/api/admin/products" },
      { id: "categories", label: "Categories", path: "/api/admin/categories" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    description: "Tables and stock control",
    items: [
      { id: "tables", label: "Tables", path: "/api/admin/tables" },
      { id: "inventory", label: "Inventory", path: "/api/admin/inventory" },
    ],
  },
  {
    id: "people",
    label: "People & access",
    description: "Users and permissions",
    items: [
      { id: "users", label: "Users", path: "/api/admin/users" },
      { id: "roles", label: "Roles", path: "/api/admin/roles" },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    description: "Sales performance",
    items: [
      {
        id: "reports",
        label: "Sales reports",
        path: "",
        third: [
          { id: "day", label: "Today" },
          { id: "week", label: "This week" },
          { id: "month", label: "This month" },
          { id: "all", label: "All time" },
        ],
      },
      { id: "history", label: "Bill history", path: "" },
    ],
  },
];
