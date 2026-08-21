import { useEffect, useState } from "react";
import {
  BarChart3,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import type { User } from "../types";
import { api } from "../api";
import {
  can,
  Empty,
  Loading,
  Metric,
  money,
  PanelTitle,
  title,
  type Screen,
  type Toast,
} from "../common";
import Inventory from "./Inventory";

type Notify = (m: string, k?: Toast["kind"]) => void;

type AdminMenuItem = {
  id: string;
  label: string;
  path: string;
  third?: { id: string; label: string }[];
};
type AdminMenuSection = {
  id: string;
  label: string;
  description: string;
  items: AdminMenuItem[];
};

export default function Admin({
  user,
  notify,
  setScreen,
}: {
  user: User;
  notify: Notify;
  setScreen: (s: Screen) => void;
}) {
  const menu: AdminMenuSection[] = [
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
  const [sectionId, setSectionId] = useState("catalog");
  const [itemId, setItemId] = useState("products");
  const [detailId, setDetailId] = useState("day");
  const [refreshKey, setRefreshKey] = useState(0);
  const [permissionCatalog, setPermissionCatalog] = useState<string[]>([]);
  const visibleMenu = menu.filter(
    (section) =>
      section.id !== "insights" || can(user, "admin.reports") || can(user, "history.view"),
  );
  const section =
    visibleMenu.find((entry) => entry.id === sectionId) ?? visibleMenu[0];
  const item =
    section.items.find((entry) => entry.id === itemId) ?? section.items[0];
  const third = item.third ?? [];
  const selectSection = (nextSection: AdminMenuSection) => {
    setSectionId(nextSection.id);
    setItemId(nextSection.items[0].id);
    setDetailId(
      nextSection.items[0].third
        ? nextSection.items[0].third[0]?.id ?? "default"
        : "default",
    );
  };
  const selectItem = (nextItem: AdminMenuItem) => {
    setItemId(nextItem.id);
    setDetailId(
      nextItem.third
        ? nextItem.third[0]?.id ?? "default"
        : "default",
    );
  };
  const canViewInventory = can(user, "inventory.view");
  const managePermission =
    item.id === "products" || item.id === "categories"
      ? "admin.manage_menu"
      : item.id === "tables"
        ? "admin.manage_tables"
        : item.id === "inventory"
          ? "admin.manage_menu"
        : item.id === "users" || item.id === "roles"
          ? "admin.manage_users"
          : "admin.reports";
  const canManage = can(user, managePermission);
  useEffect(() => {
    if (!can(user, "admin.manage_users")) return;
    api.resource<{ permissions: string[] }>("/api/admin/permissions")
      .then((result) => setPermissionCatalog(result.permissions))
      .catch(() => undefined);
  }, [user]);
  return (
    <div className={third.length ? "admin-workspace has-third" : "admin-workspace"}>
      <aside className="admin-menu-column admin-primary-menu">
        <span className="admin-column-label">Admin</span>
        {visibleMenu.map((entry) => (
          <button
            className={section.id === entry.id ? "admin-menu-item active" : "admin-menu-item"}
            key={entry.id}
            onClick={() => selectSection(entry)}
          >
            <strong>{entry.label}</strong>
            <small>{entry.description}</small>
          </button>
        ))}
      </aside>
      <aside className="admin-menu-column">
        <span className="admin-column-label">{section.label}</span>
        {section.items
        .filter((entry) =>
          (entry.id !== "inventory" || canViewInventory) &&
          (entry.id !== "reports" || can(user, "admin.reports")) &&
          (entry.id !== "history" || can(user, "history.view")),
        )
          .map((entry) => (
            <button
              className={item.id === entry.id ? "admin-menu-item active" : "admin-menu-item"}
              key={entry.id}
              onClick={() => selectItem(entry)}
            >
              <strong>{entry.label}</strong>
              <small>{entry.id === "reports" ? "Choose a reporting period" : "Manage records"}</small>
            </button>
          ))}
      </aside>
      {third.length > 0 && (
        <aside className="admin-menu-column admin-third-menu">
          <span className="admin-column-label">View</span>
          {third.map((entry) => (
            <button
              className={detailId === entry.id ? "admin-menu-item active" : "admin-menu-item"}
              key={entry.id}
              onClick={() => setDetailId(entry.id)}
            >
              <strong>{entry.label}</strong>
            </button>
          ))}
        </aside>
      )}
      <section className="admin-details">
        <div className="admin-details-header">
          <div>
            <span className="eyebrow">{section.label} / {item.label}</span>
            <h2>{item.label}</h2>
          </div>
          <div className="admin-details-actions">
            <button className="secondary" onClick={() => setRefreshKey((value) => value + 1)}>
              <RefreshCw size={15} />
              Refresh
            </button>
            <button className="primary" onClick={() => setScreen("pos")}>
              Open POS
            </button>
          </div>
        </div>
        {item.id === "reports" ? (
          <Reports key={refreshKey + detailId} notify={notify} selectedPeriod={detailId} />
        ) : item.id === "history" ? (
          <BillHistory key={refreshKey} notify={notify} />
        ) : item.id === "inventory" ? (
          <Inventory key={refreshKey} notify={notify} editable={canManage} />
        ) : (
          <ResourceTable
            key={refreshKey}
            kind={item.id}
            path={item.path}
            notify={notify}
            canManage={canManage}
            permissionCatalog={permissionCatalog}
          />
        )}
      </section>
    </div>
  );
}

type AdminField = {
  key: string;
  label: string;
  type: "text" | "number" | "checkbox" | "list";
};

const ADMIN_FIELDS: Record<string, AdminField[]> = {
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

function AdminResourceDialog({
  kind,
  row,
  onClose,
  onSave,
  permissionCatalog,
}: {
  kind: string;
  row: Record<string, unknown> | null;
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => Promise<void>;
  permissionCatalog: string[];
}) {
  const fields = ADMIN_FIELDS[kind] ?? [];
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(
      fields.map((field) => [
        field.key,
        field.type === "checkbox"
          ? row?.[field.key] ?? true
          : field.type === "list"
            ? Array.isArray(row?.[field.key])
              ? (row?.[field.key] as unknown[]).join(", ")
              : ""
            : row?.[field.key] ?? "",
      ]),
    ),
  );
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(() =>
    Array.isArray(row?.permissions) ? (row.permissions as string[]) : [],
  );
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      const body = Object.fromEntries(
        fields
          .map((field) => {
            const value = values[field.key];
            if (field.type === "list") {
              if (field.key === "permissions") return [field.key, selectedPermissions];
              return [
                field.key,
                String(value ?? "")
                  .split(",")
                  .map((entry) => entry.trim())
                  .filter(Boolean),
              ];
            }
            if (field.type === "number") return [field.key, Number(value || 0)];
            return [field.key, value];
          })
          .filter(([, value]) => value !== "" && value !== undefined),
      );
      await onSave(body);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="modal-backdrop">
      <section className="modal admin-editor">
        <div className="panel-title">
          <h2>{row ? "Edit " + title(kind) : "Add " + title(kind)}</h2>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="admin-editor-grid">
          {fields.map((field) =>
            field.key === "permissions" && permissionCatalog.length ? (
              <div className="permission-toggle-field" key={field.key}>
                <span>{field.label}</span>
                <div className="permission-toggles">
                  {permissionCatalog.map((permission) => (
                    <label className="permission-toggle" key={permission}>
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission)}
                        onChange={(e) =>
                          setSelectedPermissions((current) =>
                            e.target.checked
                              ? [...current, permission]
                              : current.filter((item) => item !== permission),
                          )
                        }
                      />
                      <span>{title(permission)}</span>
                      <small>{permission}</small>
                    </label>
                  ))}
                </div>
              </div>
            ) : field.type === "checkbox" ? (
              <label className="switch-row" key={field.key}>
                <input
                  type="checkbox"
                  checked={Boolean(values[field.key])}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.checked })
                  }
                />
                {field.label}
              </label>
            ) : (
              <label key={field.key}>
                {field.label}
                <input
                  type={field.type === "number" ? "number" : "text"}
                  value={String(values[field.key] ?? "")}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.value })
                  }
                />
              </label>
            ),
          )}
        </div>
        <div className="button-row">
          <button className="secondary" onClick={onClose}>Cancel</button>
          <button className="primary" disabled={saving} onClick={submit}>
            {saving ? "Saving…" : row ? "Save changes" : "Create"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ResourceTable({
  kind,
  path,
  notify,
  canManage,
  permissionCatalog,
}: {
  kind: string;
  path: string;
  notify: Notify;
  canManage: boolean;
  permissionCatalog: string[];
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<Record<string, unknown> | "new" | null>(null);
  const load = async () => {
    setLoading(true);
    try {
      setRows(await api.resource<Record<string, unknown>[]>(path));
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Could not load records",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [path]);
  const save = async (body: Record<string, unknown>) => {
    try {
      const isNew = editor === "new";
      const endpoint = isNew ? path : path + "/" + String(editor?.id);
      await api.mutate(endpoint, isNew ? "POST" : "PATCH", body);
      notify(isNew ? title(kind) + " created" : title(kind) + " updated");
      setEditor(null);
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not save record", "error");
    }
  };
  const remove = async (row: Record<string, unknown>) => {
    if (!window.confirm("Delete this " + title(kind).toLowerCase() + "?")) return;
    try {
      await api.mutate(path + "/" + String(row.id), "DELETE");
      notify(title(kind) + " deleted");
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not delete record", "error");
    }
  };
  const columns =
    kind === "products"
      ? ["name", "price", "active", "cost"]
      : kind === "categories"
        ? ["name", "kind", "sort"]
        : kind === "tables"
          ? ["name", "seats", "section", "active"]
          : kind === "users"
            ? ["name", "role", "active"]
            : ["name", "label", "permissions"];
  return (
    <>
    <section className="panel">
      <PanelTitle
        title={title(kind)}
        action={
          <div className="admin-table-actions">
            {canManage && (
              <button className="primary" onClick={() => setEditor("new")}>
                <Plus size={16} /> Add
              </button>
            )}
            <button className="secondary" onClick={load}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        }
      />
      {loading ? (
        <Loading />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c}>{title(c)}</th>
                ))}
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={String(row.id ?? i)}>
                  {columns.map((c) => (
                    <td key={c}>
                      {Array.isArray(row[c]) ? (
                        `${(row[c] as unknown[]).length} permissions`
                      ) : typeof row[c] === "boolean" ? (
                        <span className={row[c] ? "tag success" : "tag muted"}>
                          {row[c] ? "Active" : "Inactive"}
                        </span>
                      ) : c === "price" || c === "cost" ? (
                        money(Number(row[c] ?? 0))
                      ) : (
                        String(row[c] ?? "—")
                      )}
                    </td>
                  ))}
                  {canManage && (
                    <td>
                      <div className="row-actions">
                        <button className="icon-button" title="Edit" onClick={() => setEditor(row)}>
                          <Pencil size={16} />
                        </button>
                        <button className="icon-button danger-icon" title="Delete" onClick={() => remove(row)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <Empty
              title={`No ${kind}`}
              text="Create records through the API or extend this workspace with the configured fields."
            />
          )}
        </div>
      )}
    </section>
    {editor !== null && (
      <AdminResourceDialog
        kind={kind}
        row={editor === "new" ? null : editor}
        onClose={() => setEditor(null)}
        onSave={save}
        permissionCatalog={permissionCatalog}
      />
    )}
    </>
  );
}

function Reports({
  notify,
  selectedPeriod = "day",
}: {
  notify: Notify;
  selectedPeriod?: string;
}) {
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [period, setPeriod] = useState(selectedPeriod);
  useEffect(() => {
    api
      .resource<Record<string, unknown>>(
        `/api/admin/reports/sales-summary?period=${period}`,
      )
      .then(setReport)
      .catch((e) =>
        notify(
          e instanceof Error ? e.message : "Could not load report",
          "error",
        ),
      );
  }, [period]);
  return (
    <section className="panel">
      <PanelTitle title="Sales report" />
      <div className="inline-form">
        <label>
          Period
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="day">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="all">All time</option>
          </select>
        </label>
      </div>
      <div className="metric-grid compact">
        {report &&
          Object.entries(report)
            .filter(([key]) => key !== "period")
            .map(([key, value]) => (
              <Metric
                key={key}
                label={title(key)}
                value={
                  key.includes("revenue") ||
                  key.includes("value") ||
                  key === "cogs" ||
                  key === "profit"
                    ? money(Number(value))
                    : Number(value)
                }
                icon={BarChart3}
              />
            ))}
      </div>
    </section>
  );
}

function BillHistory({ notify }: { notify: Notify }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.resource<Record<string, unknown>[]>("/api/admin/reports/bill-history?period=all")
      .then(setRows)
      .catch((e) => notify(e instanceof Error ? e.message : "Could not load bill history", "error"))
      .finally(() => setLoading(false));
  }, []);
  return (
    <section className="panel">
      <PanelTitle title="Bill history" />
      {loading ? <Loading /> : !rows.length ? <Empty title="No bill history" text="Paid and open bills will appear here." /> : (
        <div className="table-wrap"><table><thead><tr><th>Bill</th><th>Table</th><th>Status</th><th>Total</th><th>Created</th></tr></thead><tbody>
          {rows.map((row, index) => <tr key={String(row.order_id ?? index)}><td>#{String(row.order_number ?? "—")}</td><td>{String(row.table_name ?? "—")}</td><td>{String(row.status ?? "—")}</td><td>{money(Number(row.total ?? 0))}</td><td>{String(row.created_at ?? "—")}</td></tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}
