// Editor schema for the generic resource dialog. Each Admin resource kind
// (products/categories/tables/users/roles) maps to a field list with type
// hints. The dialog uses this to render the right input control.

export type AdminField = {
  key: string;
  label: string;
  type: "text" | "number" | "checkbox" | "list";
};

export const ADMIN_FIELDS: Record<string, AdminField[]> = {
  products: [
    { key: "name", label: "Name", type: "text" },
    { key: "description", label: "Description", type: "text" },
    { key: "price", label: "Price", type: "number" },
    { key: "category_id", label: "Category ID", type: "number" },
    { key: "active", label: "Active", type: "checkbox" },
    { key: "cost", label: "Cost", type: "number" },
    { key: "kind", label: "Station", type: "text" },
  ],
  categories: [
    { key: "name", label: "Name", type: "text" },
    { key: "color", label: "Color", type: "text" },
    { key: "icon", label: "Icon", type: "text" },
    { key: "sort", label: "Sort order", type: "number" },
    { key: "kind", label: "Station", type: "text" },
  ],
  tables: [
    { key: "name", label: "Name", type: "text" },
    { key: "seats", label: "Seats", type: "number" },
    { key: "active", label: "Active", type: "checkbox" },
    { key: "section", label: "Section", type: "text" },
    { key: "sort", label: "Sort order", type: "number" },
  ],
  users: [
    { key: "name", label: "Name", type: "text" },
    { key: "pin", label: "PIN", type: "text" },
    { key: "role", label: "Role", type: "text" },
    { key: "permissions", label: "Permissions", type: "list" },
    { key: "active", label: "Active", type: "checkbox" },
  ],
  roles: [
    { key: "name", label: "Name", type: "text" },
    { key: "label", label: "Label", type: "text" },
    { key: "color", label: "Color", type: "text" },
    { key: "sort", label: "Sort order", type: "number" },
    { key: "permissions", label: "Permissions", type: "list" },
  ],
};
