import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  BarChart3,
  ChefHat,
  CircleDollarSign,
  Coffee,
  Database,
  Eye,
  FileText,
  Grid3X3,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Pencil,
  Printer,
  Plus,
  RefreshCw,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Tags,
  Users,
  Utensils,
  Trash2,
  X,
} from "lucide-react";
import { api, getToken, setToken } from "./api";
import type {
  Category,
  DiscountPolicy,
  Menu,
  ModuleState,
  Order,
  Product,
  Settings as ApiSettings,
  Table,
  Tax,
  User,
} from "./types";
import { can, Empty, Loading, Metric, money, PanelTitle, title, useToast, type Screen, type Toast } from "./common";
import Login from "./screens/Login";
import POS from "./screens/POS";
import Station from "./screens/Station";
import Cashier from "./screens/Cashier";
import {
  DEFAULT_UI,
  readUISettings,
  saveUISettings,
  type UISettings,
} from "./theme";


function App() {
  const [user, setUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<Screen>("pos");
  const [modules, setModules] = useState<ModuleState[]>([]);
  if (!user && !getToken())
    return (
      <Login
        onLogin={(u, token) => {
          setToken(token);
          setUser(u);
        }}
      />
    );
  return (
    <Root
      user={user}
      setUser={setUser}
      screen={screen}
      setScreen={setScreen}
      modules={modules}
      setModules={setModules}
    />
  );
}

function Root({
  user: initialUser,
  setUser: setInitialUser,
  screen,
  setScreen,
  modules,
  setModules,
}: {
  user: User | null;
  setUser: (u: User | null) => void;
  screen: Screen;
  setScreen: (s: Screen) => void;
  modules: ModuleState[];
  setModules: (m: ModuleState[]) => void;
}) {
  const [user, setUser] = useState(initialUser);
  const { toast, notify } = useToast();
  const [error, setError] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const [me, state] = await Promise.all([api.me(), api.modules()]);
        setUser(me);
        setInitialUser(me);
        setModules(state.modules);
      } catch (e) {
        setToken("");
        setError(e instanceof Error ? e.message : "Session expired");
      }
    })();
  }, [setInitialUser, setModules]);
  if (!user || error)
    return (
      <Login
        onLogin={(u, token) => {
          setToken(token);
          setUser(u);
          setInitialUser(u);
          setError("");
        }}
      />
    );
  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        screen={screen}
        setScreen={setScreen}
        modules={modules}
        onLogout={() => {
          setToken("");
          setInitialUser(null);
        }}
      />
      <main className="main-content">
        <header className="topbar">
          <button
            className="topbar-logout"
            onClick={() => {
              setToken("");
              setInitialUser(null);
            }}
            aria-label="Sign out"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
          <div className="topbar-title">
            <p className="eyebrow">{title(screen)}</p>
            <h1>{title(screen)}</h1>
          </div>
          <div className="topbar-user">
            <span className="status-dot" />
            {user.name}
            <span className="role-pill">{user.role}</span>
          </div>
        </header>
        <div className="page-body">
          {screen === "pos" && <POS user={user} notify={notify} />}
          {(screen === "kitchen" || screen === "bar") && (
            <Station station={screen} user={user} notify={notify} />
          )}
          {screen === "cashier" && <Cashier user={user} notify={notify} />}
          {screen === "admin" && (
            <Admin user={user} notify={notify} setScreen={setScreen} />
          )}
          {screen === "settings" && (
            <SettingsPage user={user} notify={notify} />
          )}
        </div>
      </main>
      {toast && (
        <div className={`toast ${toast.kind ?? ""}`}>{toast.message}</div>
      )}
    </div>
  );
}

function Sidebar({
  user,
  screen,
  setScreen,
  modules,
  onLogout,
}: {
  user: User;
  screen: Screen;
  setScreen: (s: Screen) => void;
  modules: ModuleState[];
  onLogout: () => void;
}) {
  const enabled = (key: string) =>
    modules.find((m) => m.key === key)?.enabled !== false;
  const items: {
    id: Screen;
    label: string;
    icon: typeof LayoutDashboard;
    permission?: string;
    module?: string;
  }[] = [
    {
      id: "admin",
      label: "Administration",
      icon: Users,
      permission: "admin.view",
      module: "admin",
    },
    {
      id: "kitchen",
      label: "Kitchen",
      icon: ChefHat,
      permission: "kitchen.view",
      module: "orders",
    },
    {
      id: "pos",
      label: "Point of sale",
      icon: ShoppingBag,
      permission: "pos.view",
      module: "orders",
    },
    {
      id: "bar",
      label: "Bar",
      icon: Utensils,
      permission: "bar.view",
      module: "orders",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      permission: "settings.view",
      module: "settings",
    },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark small">
          <Coffee size={20} />
        </div>
        <span>Brew-POS</span>
      </div>
      <nav>
        {items
          .filter(
            (item) =>
              (!item.permission || can(user, item.permission)) &&
              (!item.module || enabled(item.module)),
          )
          .map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={screen === item.id ? "nav-item active" : "nav-item"}
                key={item.id}
                onClick={() => setScreen(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
      </nav>
    </aside>
  );
}


function Admin({
  user,
  notify,
  setScreen,
}: {
  user: User;
  notify: (m: string, k?: Toast["kind"]) => void;
  setScreen: (s: Screen) => void;
}) {
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
  notify: (m: string, k?: Toast["kind"]) => void;
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
  notify: (m: string, k?: Toast["kind"]) => void;
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

function BillHistory({ notify }: { notify: (m: string, k?: Toast["kind"]) => void }) {
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

function SettingsPage({
  user,
  notify,
}: {
  user: User;
  notify: (m: string, k?: Toast["kind"]) => void;
}) {
  const [settings, setSettings] = useState<ApiSettings | null>(null);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [discount, setDiscount] = useState<DiscountPolicy | null>(null);
  const [printer, setPrinter] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState("general");
  const [uiSettings, setUiSettings] = useState<UISettings>(() => readUISettings());
  const editable = can(user, "admin.manage_settings");
  const load = async () => {
    try {
      const [s, t, d, p] = await Promise.all([
        api.settings(),
        api.taxes(),
        api.discount(),
        api.printer(),
      ]);
      setSettings(s);
      setTaxes((t as unknown as { taxes: Tax[] }).taxes ?? []);
      setDiscount(d);
      setPrinter(p as unknown as Record<string, unknown>);
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Could not load settings",
        "error",
      );
    }
  };
  useEffect(() => {
    load();
  }, []);
  const save = async (path: string, body: unknown) => {
    try {
      await api.updateSettings(
        path,
        body,
        path === "/order-approval" ? "POST" : "PUT",
      );
      notify("Settings saved");
      load();
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Could not save settings",
        "error",
      );
    }
  };
  if (!settings || !discount || !printer) return <Loading />;
  return (
    <div className="stack">
      <div className="tab-bar">
        {[
          "general",
          "appearance",
          "tax",
          "discount",
          "printer",
          "database",
        ].map((t) => (
          <button
            className={tab === t ? "tab active" : "tab"}
            key={t}
            onClick={() => setTab(t)}
          >
            {title(t)}
          </button>
        ))}
      </div>
      <section className="panel settings-panel">
        {tab === "general" && (
          <>
            <PanelTitle title="Workspace settings" />
            <div className="settings-grid">
              <SettingValue label="Products" value={settings.product_count} />
              <SettingValue label="Users" value={settings.user_count} />
              <SettingValue label="Database" value={settings.db_kind} />
              <label>
                Interface scale
                <input
                  type="number"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  defaultValue={settings.text_size}
                  onBlur={(e) =>
                    editable &&
                    save("/text-size", { text_size: Number(e.target.value) })
                  }
                />
              </label>
              <label className="switch-row">
                <input
                  type="checkbox"
                  checked={settings.order_approval_required}
                  disabled={!editable}
                  onChange={(e) =>
                    save("/order-approval", {
                      order_approval_required: e.target.checked,
                    })
                  }
                />{" "}
                Require order approval
              </label>
            </div>
          </>
        )}
        {tab === "appearance" && (
          <AppearanceSettings
            settings={uiSettings}
            setSettings={(next) => {
              setUiSettings(next);
              saveUISettings(next);
            }}
          />
        )}
        {tab === "tax" && (
          <TaxSettings
            taxes={taxes}
            setTaxes={setTaxes}
            save={(body) => save("/tax", body)}
            editable={editable}
          />
        )}
        {tab === "discount" && (
          <DiscountSettings
            policy={discount}
            setPolicy={setDiscount}
            save={(body) => save("/discount", body)}
            editable={editable}
          />
        )}
        {tab === "printer" && (
          <PrinterSettings
            config={printer}
            setConfig={setPrinter}
            save={async (body) => {
              try {
                setPrinter(await api.updatePrinter(body));
                notify("Printer settings saved");
              } catch (e) {
                notify(
                  e instanceof Error
                    ? e.message
                    : "Could not save printer settings",
                  "error",
                );
              }
            }}
            test={async () => {
              try {
                await api.testPrinter();
                notify("Printer test sent");
              } catch (e) {
                notify(
                  e instanceof Error ? e.message : "Printer test failed",
                  "error",
                );
              }
            }}
            editable={editable}
          />
        )}
        {tab === "database" && (
          <DatabaseSettings
            settings={settings}
            save={(path) =>
              api
                .mutate(path, "POST")
                .then(() => {
                  notify("Database action completed");
                  load();
                })
                .catch((e) =>
                  notify(
                    e instanceof Error ? e.message : "Database action failed",
                    "error",
                  ),
                )
            }
            editable={editable}
          />
        )}
      </section>
    </div>
  );
}
function AppearanceSettings({
  settings,
  setSettings,
}: {
  settings: UISettings;
  setSettings: (settings: UISettings) => void;
}) {
  const update = (key: keyof UISettings, value: number) =>
    setSettings({ ...settings, [key]: value });
  const fields: { key: keyof UISettings; label: string; min: number; max: number }[] = [
    { key: "buttonRadius", label: "Button corners", min: 0, max: 32 },
    { key: "cardRadius", label: "Card corners", min: 0, max: 32 },
    { key: "inputRadius", label: "Input corners", min: 0, max: 32 },
    { key: "chipRadius", label: "Chip corners", min: 0, max: 32 },
    { key: "cardGap", label: "Card spacing", min: 4, max: 32 },
    { key: "buttonHeight", label: "Button height", min: 48, max: 96 },
    { key: "bottomBarHeight", label: "Top / bottom bar height", min: 64, max: 112 },
  ];
  return (
    <>
      <PanelTitle
        title="Appearance"
        action={
          <button className="secondary" onClick={() => setSettings(DEFAULT_UI)}>
            Reset appearance
          </button>
        }
      />
      <p className="muted">Adjust the shape and touch density of every workspace surface.</p>
      <div className="settings-grid appearance-grid">
        {fields.map((field) => (
          <label key={field.key}>
            {field.label}
            <input
              type="range"
              min={field.min}
              max={field.max}
              value={settings[field.key] as number}
              onChange={(event) => update(field.key, Number(event.target.value))}
            />
            <strong>{settings[field.key] as number}px</strong>
          </label>
        ))}
      </div>
    </>
  );
}

function SettingValue({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="setting-value">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function TaxSettings({
  taxes,
  setTaxes,
  save,
  editable,
}: {
  taxes: Tax[];
  setTaxes: (v: Tax[]) => void;
  save: (v: unknown) => void;
  editable: boolean;
}) {
  return (
    <>
      <PanelTitle
        title="Taxes"
        action={
          <button
            className="primary"
            disabled={!editable}
            onClick={() => save({ taxes })}
          >
            Save taxes
          </button>
        }
      />
      <div className="editable-list">
        {taxes.map((tax, i) => (
          <div className="edit-row" key={i}>
            <input
              value={tax.name}
              disabled={!editable}
              onChange={(e) =>
                setTaxes(
                  taxes.map((x, j) =>
                    j === i ? { ...x, name: e.target.value } : x,
                  ),
                )
              }
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={tax.rate}
              disabled={!editable}
              onChange={(e) =>
                setTaxes(
                  taxes.map((x, j) =>
                    j === i ? { ...x, rate: Number(e.target.value) } : x,
                  ),
                )
              }
            />
            <button
              className="icon-button"
              disabled={!editable}
              onClick={() => setTaxes(taxes.filter((_, j) => j !== i))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          className="secondary"
          disabled={!editable}
          onClick={() => setTaxes([...taxes, { name: "", rate: 0 }])}
        >
          Add tax
        </button>
      </div>
    </>
  );
}
function DiscountSettings({
  policy,
  setPolicy,
  save,
  editable,
}: {
  policy: DiscountPolicy;
  setPolicy: (v: DiscountPolicy) => void;
  save: (v: unknown) => void;
  editable: boolean;
}) {
  return (
    <>
      <PanelTitle
        title="Discount policy"
        action={
          <button
            className="primary"
            disabled={!editable}
            onClick={() => save(policy)}
          >
            Save discounts
          </button>
        }
      />
      <div className="settings-grid">
        <label>
          Maximum discount %
          <input
            type="number"
            min="0"
            max="100"
            value={policy.max_discount_pct * 100}
            disabled={!editable}
            onChange={(e) =>
              setPolicy({
                ...policy,
                max_discount_pct: Number(e.target.value) / 100,
              })
            }
          />
        </label>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={policy.require_reason}
            disabled={!editable}
            onChange={(e) =>
              setPolicy({ ...policy, require_reason: e.target.checked })
            }
          />{" "}
          Require reason
        </label>
      </div>
      <h3>Presets</h3>
      <div className="editable-list">
        {policy.presets.map((p, i) => (
          <div className="edit-row" key={i}>
            <input
              value={p.label}
              disabled={!editable}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  presets: policy.presets.map((x, j) =>
                    j === i ? { ...x, label: e.target.value } : x,
                  ),
                })
              }
            />
            <select
              value={p.mode}
              disabled={!editable}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  presets: policy.presets.map((x, j) =>
                    j === i ? { ...x, mode: e.target.value } : x,
                  ),
                })
              }
            >
              <option value="amount">Amount</option>
              <option value="percent">Percent</option>
            </select>
            <input
              type="number"
              value={p.value}
              disabled={!editable}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  presets: policy.presets.map((x, j) =>
                    j === i ? { ...x, value: Number(e.target.value) } : x,
                  ),
                })
              }
            />
          </div>
        ))}
      </div>
    </>
  );
}
function PrinterSettings({
  config,
  setConfig,
  save,
  test,
  editable,
}: {
  config: Record<string, unknown>;
  setConfig: (v: Record<string, unknown>) => void;
  save: (v: unknown) => void;
  test: () => void;
  editable: boolean;
}) {
  const network = (config.network ?? {}) as Record<string, unknown>;
  const paper = (config.paper ?? {}) as Record<string, unknown>;
  return (
    <>
      <PanelTitle
        title="Printer"
        action={
          <>
            <button className="secondary" onClick={test}>
              <Printer size={15} />
              Test
            </button>
            <button
              className="primary"
              disabled={!editable}
              onClick={() => save(config)}
            >
              Save printer
            </button>
          </>
        }
      />
      <div className="settings-grid">
        <label>
          Mode
          <select
            value={String(config.mode ?? "dummy")}
            disabled={!editable}
            onChange={(e) => setConfig({ ...config, mode: e.target.value })}
          >
            <option value="dummy">Dummy</option>
            <option value="network">Network</option>
            <option value="usb">USB</option>
          </select>
        </label>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={Boolean(config.dry_run)}
            disabled={!editable}
            onChange={(e) =>
              setConfig({ ...config, dry_run: e.target.checked })
            }
          />{" "}
          Dry run
        </label>
        <label>
          Network host
          <input
            value={String(network.host ?? "")}
            disabled={!editable}
            onChange={(e) =>
              setConfig({
                ...config,
                network: { ...network, host: e.target.value },
              })
            }
          />
        </label>
        <label>
          Network port
          <input
            type="number"
            value={Number(network.port ?? 9100)}
            disabled={!editable}
            onChange={(e) =>
              setConfig({
                ...config,
                network: { ...network, port: Number(e.target.value) },
              })
            }
          />
        </label>
        <label>
          Receipt header
          <input
            value={
              Array.isArray(paper.header_lines)
                ? paper.header_lines.join("\n")
                : ""
            }
            disabled={!editable}
            onChange={(e) =>
              setConfig({
                ...config,
                paper: { ...paper, header_lines: e.target.value.split("\n") },
              })
            }
          />
        </label>
        <label>
          Receipt footer
          <input
            value={
              Array.isArray(paper.footer_lines)
                ? paper.footer_lines.join("\n")
                : ""
            }
            disabled={!editable}
            onChange={(e) =>
              setConfig({
                ...config,
                paper: { ...paper, footer_lines: e.target.value.split("\n") },
              })
            }
          />
        </label>
      </div>
    </>
  );
}
function DatabaseSettings({
  settings,
  save,
  editable,
}: {
  settings: ApiSettings;
  save: (path: string) => void;
  editable: boolean;
}) {
  return (
    <>
      <PanelTitle title="Database" />
      <div className="database-card">
        <strong>{settings.db_kind}</strong>
        <code>{settings.database_url}</code>
        <span>
          {settings.db_file_exists
            ? "Database is available"
            : "Database file is not present"}
        </span>
      </div>
      <div className="button-row">
        <button
          className="secondary"
          disabled={!editable}
          onClick={() => save("/database/reload")}
        >
          Reload database
        </button>
        <button
          className="danger"
          disabled={!editable}
          onClick={() => {
            if (window.confirm("Reset the database and seed defaults?"))
              save("/database/reset");
          }}
        >
          Reset and reseed
        </button>
        <button
          className="secondary"
          disabled={!editable}
          onClick={() => save("/database/restore-defaults")}
        >
          Restore defaults
        </button>
      </div>
    </>
  );
}

function Inventory({
  notify,
  editable,
}: {
  notify: (m: string, k?: Toast["kind"]) => void;
  editable: boolean;
}) {
  const [stock, setStock] = useState<Record<string, unknown>[]>([]);
  const [menu, setMenu] = useState<Menu | null>(null);
  const load = () =>
    Promise.all([api.stock(), api.menu()])
      .then(([s, m]) => {
        setStock(s as Record<string, unknown>[]);
        setMenu(m);
      })
      .catch((e) =>
        notify(
          e instanceof Error ? e.message : "Could not load inventory",
          "error",
        ),
      );
  useEffect(() => {
    load();
  }, []);
  const editStock = async (item: Record<string, unknown>) => {
    const quantity = window.prompt("Quantity", String(item.quantity ?? 0));
    if (quantity === null) return;
    const threshold = window.prompt(
      "Low stock threshold",
      String(item.low_stock_threshold ?? 0),
    );
    if (threshold === null) return;
    try {
      await api.updateStock(Number(item.product_id), {
        quantity: Number(quantity),
        low_stock_threshold: Number(threshold),
      });
      notify("Inventory updated");
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not update inventory", "error");
    }
  };
  return (
    <section className="panel">
      <PanelTitle
        title="Inventory"
        action={
          <button className="secondary" onClick={load}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Low threshold</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((item) => {
              const product = menu?.products.find(
                (p) => p.id === Number(item.product_id),
              );
              return (
                <tr key={String(item.id)}>
                  <td>{product?.name ?? `Product ${item.product_id}`}</td>
                  <td>{String(item.quantity)}</td>
                  <td>{String(item.low_stock_threshold)}</td>
                  <td>
                    {editable && (
                      <button className="icon-button" title="Edit stock" onClick={() => editStock(item)}>
                        <Pencil size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!stock.length && (
          <Empty
            title="No stock records"
            text="Stock records are created from the configured product catalog."
          />
        )}
      </div>
    </section>
  );
}

export default App;
