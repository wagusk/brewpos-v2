// Editor schema for the generic resource dialog. Each Admin resource kind
// (products/categories/tables/users/roles) maps to a field list with type
// hints. The dialog uses this to render the right input control.

export type AdminField = {
  key: string;
  label: string;
  type: "text" | "number" | "checkbox" | "list" | "select";
  // Required when type === "select". Each option maps a stored value to a
  // display label. A `null` value means "not set" (send null/omit to
  // backend, which interprets it as "inherit / use default").
  options?: { value: string | null; label: string }[];
};

// Station options shared by products and categories. Categories are
// required to have a kind; products can leave it unset to inherit the
// category's kind at order-time.
const STATION_OPTIONS = [
  { value: "kitchen", label: "Kitchen" },
  { value: "bar", label: "Bar" },
  { value: "both", label: "Both" },
];

export const ADMIN_FIELDS: Record<string, AdminField[]> = {
  products: [
    { key: "name", label: "Name", type: "text" },
    { key: "description", label: "Description", type: "text" },
    { key: "price", label: "Price", type: "number" },
    { key: "category_id", label: "Category ID", type: "number" },
    { key: "active", label: "Active", type: "checkbox" },
    { key: "cost", label: "Cost", type: "number" },
    {
      key: "kind",
      label: "Station",
      type: "select",
      options: [
        { value: null, label: "Use category default" },
        ...STATION_OPTIONS,
      ],
    },
  ],
  categories: [
    { key: "name", label: "Name", type: "text" },
    { key: "color", label: "Color", type: "text" },
    { key: "icon", label: "Icon", type: "text" },
    { key: "sort", label: "Sort order", type: "number" },
    {
      key: "kind",
      label: "Station",
      type: "select",
      options: STATION_OPTIONS,
    },
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
