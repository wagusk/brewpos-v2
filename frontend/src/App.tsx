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
  Package,
  Printer,
  RefreshCw,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Tags,
  Users,
  Utensils,
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
import {
  DEFAULT_UI,
  readUISettings,
  saveUISettings,
  type UISettings,
} from "./theme";

type Screen =
  | "pos"
  | "kitchen"
  | "bar"
  | "cashier"
  | "admin"
  | "settings"
  | "inventory";
type CartLine = {
  product: Product;
  qty: number;
  modifiers: number[];
  notes: string;
};
type Toast = { message: string; kind?: "error" | "success" };

const money = (value = 0) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value);
const title = (value: string) =>
  value.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const can = (user: User, permission: string) =>
  user.role === "admin" ||
  user.role === "master" ||
  user.permissions.includes(permission);

function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const notify = (message: string, kind: Toast["kind"] = "success") => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 3500);
  };
  return { toast, notify };
}

function Login({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    if (pin.length < 3) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.login(pin);
      onLogin(result.user, result.access_token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">
          <Coffee size={26} />
        </div>
        <p className="eyebrow">Brew-POS</p>
        <h1>Sign in to your workspace</h1>
        <p className="muted">Use your staff PIN to continue.</p>
        <div className="pin-display" aria-label="PIN">
          {pin ? "•".repeat(pin.length) : "Enter PIN"}
        </div>
        <div className="pin-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} onClick={() => pin.length < 8 && setPin(pin + n)}>
              {n}
            </button>
          ))}
          <button onClick={() => setPin("")}>Clear</button>
          <button onClick={() => pin.length < 8 && setPin(pin + "0")}>0</button>
          <button onClick={() => setPin(pin.slice(0, -1))}>⌫</button>
        </div>
        {error && <div className="alert error">{error}</div>}
        <button
          className="primary full"
          disabled={busy || pin.length < 3}
          onClick={submit}
        >
          {busy ? "Signing in…" : "Continue"}
        </button>
      </section>
    </main>
  );
}

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
          <div>
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
          {screen === "admin" && <Admin user={user} notify={notify} />}
          {screen === "settings" && (
            <SettingsPage user={user} notify={notify} />
          )}
          {screen === "inventory" && <Inventory user={user} notify={notify} />}
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
      id: "pos",
      label: "Point of sale",
      icon: ShoppingBag,
      permission: "pos.view",
      module: "orders",
    },
    {
      id: "cashier",
      label: "Cashier",
      icon: HandCoins,
      permission: "order.close",
      module: "orders",
    },
    {
      id: "kitchen",
      label: "Kitchen",
      icon: ChefHat,
      permission: "kitchen.view",
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
      id: "admin",
      label: "Administration",
      icon: Users,
      permission: "admin.view",
      module: "admin",
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: Package,
      permission: "settings.view",
      module: "inventory",
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

function Dashboard({
  user,
  notify,
  setScreen,
}: {
  user: User;
  notify: (m: string, k?: Toast["kind"]) => void;
  setScreen: (s: Screen) => void;
}) {
  const [stats, setStats] = useState({
    today_orders: 0,
    today_revenue: 0,
    open_tickets: 0,
    avg_ticket: 0,
  });
  const [tables, setTables] = useState<Table[]>([]);
  const load = async () => {
    try {
      const [s, t] = await Promise.all([api.stats(), api.tables()]);
      setStats(s);
      setTables(t);
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Could not load overview",
        "error",
      );
    }
  };
  useEffect(() => {
    load();
    const id = window.setInterval(load, 15000);
    return () => window.clearInterval(id);
  }, []);
  const occupied = tables.filter((t) => t.order_id).length;
  const free = tables.filter((t) => t.active && !t.order_id).length;
  return (
    <div className="stack">
      <div className="page-actions">
        <p className="muted">
          Live business data from the configured database.
        </p>
        <button className="secondary" onClick={load}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>
      <div className="metric-grid">
        <Metric
          label="Revenue today"
          value={money(stats.today_revenue)}
          icon={CircleDollarSign}
        />
        <Metric
          label="Orders today"
          value={stats.today_orders}
          icon={FileText}
        />
        <Metric
          label="Open tickets"
          value={stats.open_tickets}
          icon={ChefHat}
        />
        <Metric
          label="Average ticket"
          value={money(stats.avg_ticket)}
          icon={BarChart3}
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <PanelTitle
            title="Floor status"
            action={
              <button className="text-button" onClick={() => setScreen("pos")}>
                Open POS <Eye size={15} />
              </button>
            }
          />
          <div className="floor-summary">
            <div>
              <strong>{free}</strong>
              <span>Available tables</span>
            </div>
            <div>
              <strong>{occupied}</strong>
              <span>Occupied tables</span>
            </div>
            <div>
              <strong>{tables.length}</strong>
              <span>Total tables</span>
            </div>
          </div>
          <div className="table-mini-grid">
            {tables.slice(0, 12).map((t) => (
              <div
                className={`table-mini ${t.order_id ? "occupied" : ""}`}
                key={t.id}
              >
                <strong>{t.name}</strong>
                <small>
                  {t.order_id
                    ? money(t.order_total ?? 0)
                    : t.active
                      ? "Available"
                      : "Inactive"}
                </small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <PanelTitle title="Workspace access" />
          <div className="access-list">
            {["pos.view", "order.close", "kitchen.view", "admin.view"].map(
              (permission) => (
                <div className="access-row" key={permission}>
                  <span>{title(permission)}</span>
                  <span
                    className={
                      can(user, permission) ? "tag success" : "tag muted"
                    }
                  >
                    {can(user, permission) ? "Allowed" : "Restricted"}
                  </span>
                </div>
              ),
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof CircleDollarSign;
}) {
  return (
    <div className="metric">
      <div className="metric-icon">
        <Icon size={21} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
function PanelTitle({
  title: label,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel-title">
      <h2>{label}</h2>
      {action}
    </div>
  );
}

function POS({
  user,
  notify,
}: {
  user: User;
  notify: (m: string, k?: Toast["kind"]) => void;
}) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [category, setCategory] = useState<number | null>(null);
  const [tableId, setTableId] = useState<number | "">("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [customer, setCustomer] = useState("");
  const [payment, setPayment] = useState("cash");
  const [tendered, setTendered] = useState("");
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      const [m, t] = await Promise.all([api.menu(), api.tables()]);
      setMenu(m);
      setTables(t);
      if (category === null && m.categories[0]) setCategory(m.categories[0].id);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not load menu", "error");
    }
  };
  useEffect(() => {
    load();
  }, []);
  const products = useMemo(
    () =>
      menu?.products.filter(
        (p) => p.active && (category === null || p.category_id === category),
      ) ?? [],
    [menu, category],
  );
  const subtotal = cart.reduce(
    (sum, line) =>
      sum +
      line.product.price * line.qty +
      line.modifiers.reduce(
        (x, id) =>
          x +
          (line.product.modifier_groups
            .flatMap((g) => g.options)
            .find((o) => o.id === id)?.price_delta ?? 0) *
            line.qty,
        0,
      ),
    0,
  );
  const addProduct = (product: Product, modifiers: number[] = []) =>
    setCart((current) => {
      const found = current.find(
        (line) =>
          line.product.id === product.id &&
          JSON.stringify(line.modifiers) === JSON.stringify(modifiers),
      );
      return found
        ? current.map((line) =>
            line === found ? { ...line, qty: line.qty + 1 } : line,
          )
        : [...current, { product, qty: 1, modifiers, notes: "" }];
    });
  const submit = async () => {
    if (!cart.length || busy) return;
    setBusy(true);
    try {
      const body = {
        table_id: tableId || null,
        type: tableId ? "dine_in" : "takeaway",
        customer_name: customer,
        items: cart.map((l) => ({
          product_id: l.product.id,
          qty: l.qty,
          modifiers: l.modifiers,
          notes: l.notes,
        })),
        payment_method: payment,
        tendered: Number(tendered || subtotal),
      };
      const result = orderId
        ? await api.appendItems(orderId, { items: body.items })
        : await api.checkout(body);
      setOrderId(result.id);
      setCart([]);
      notify(`Order #${result.number} saved`);
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not save order", "error");
    } finally {
      setBusy(false);
    }
  };
  if (!menu) return <Loading />;
  return (
    <div className="pos-layout">
      <section className="pos-menu">
        <div className="page-actions">
          <div>
            <p className="muted">
              Choose live menu items from the configured catalog.
            </p>
          </div>
          <button className="secondary" onClick={load}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
        <div className="category-tabs">
          {menu.categories
            .slice()
            .sort((a, b) => a.sort - b.sort)
            .map((c) => (
              <button
                key={c.id}
                className={
                  category === c.id ? "category-tab active" : "category-tab"
                }
                style={{ "--accent": c.color } as CSSProperties}
                onClick={() => setCategory(c.id)}
              >
                {c.name}
              </button>
            ))}
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <button
              className="product-card"
              key={product.id}
              onClick={() =>
                product.modifier_groups.length
                  ? setModifierProduct(product)
                  : addProduct(product)
              }
            >
              <span
                className="product-color"
                style={{
                  background: menu.categories.find(
                    (c) => c.id === product.category_id,
                  )?.color,
                }}
              />
              <strong>{product.name}</strong>
              <small>{product.description || " "}</small>
              <b>{money(product.price)}</b>
            </button>
          ))}
        </div>
      </section>
      <aside className="cart-panel">
        <PanelTitle
          title={orderId ? `Order #${orderId}` : "Current order"}
          action={
            cart.length ? (
              <button className="icon-button" onClick={() => setCart([])}>
                <X size={17} />
              </button>
            ) : undefined
          }
        />
        <label>
          Table
          <select
            value={tableId}
            onChange={(e) =>
              setTableId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">Takeaway / no table</option>
            {tables
              .filter((t) => t.active)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.order_id ? ` · open #${t.order_number}` : ""}
                </option>
              ))}
          </select>
        </label>
        <label>
          Customer
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Optional name"
          />
        </label>
        <div className="cart-lines">
          {cart.length ? (
            cart.map((line, index) => (
              <div className="cart-line" key={`${line.product.id}-${index}`}>
                <div>
                  <strong>{line.product.name}</strong>
                  <small>
                    {line.modifiers
                      .map(
                        (id) =>
                          line.product.modifier_groups
                            .flatMap((g) => g.options)
                            .find((o) => o.id === id)?.name,
                      )
                      .filter(Boolean)
                      .join(", ")}
                  </small>
                </div>
                <div className="line-controls">
                  <button
                    onClick={() =>
                      setCart((c) =>
                        c.flatMap((x, i) =>
                          i === index
                            ? x.qty > 1
                              ? [{ ...x, qty: x.qty - 1 }]
                              : []
                            : [x],
                        ),
                      )
                    }
                  >
                    −
                  </button>
                  <span>{line.qty}</span>
                  <button
                    onClick={() =>
                      setCart((c) =>
                        c.map((x, i) =>
                          i === index ? { ...x, qty: x.qty + 1 } : x,
                        ),
                      )
                    }
                  >
                    +
                  </button>
                </div>
                <b>{money(line.product.price * line.qty)}</b>
              </div>
            ))
          ) : (
            <Empty
              title="Your order is empty"
              text="Select items from the menu to begin."
            />
          )}
        </div>
        <div className="cart-total">
          <span>Subtotal</span>
          <strong>{money(subtotal)}</strong>
        </div>
        <label>
          Payment
          <select value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile">Mobile</option>
          </select>
        </label>
        {payment === "cash" && (
          <label>
            Tendered
            <input
              type="number"
              min="0"
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
              placeholder={subtotal.toFixed(2)}
            />
          </label>
        )}
        <button
          className="primary full"
          disabled={
            !cart.length ||
            busy ||
            (orderId !== null && !can(user, "order.append"))
          }
          onClick={submit}
        >
          {busy ? "Saving…" : orderId ? "Add to open order" : "Send order"}
        </button>
      </aside>
      {modifierProduct && (
        <ModifierDialog
          product={modifierProduct}
          onClose={() => setModifierProduct(null)}
          onAdd={(mods) => {
            addProduct(modifierProduct, mods);
            setModifierProduct(null);
          }}
        />
      )}
    </div>
  );
}

function ModifierDialog({
  product,
  onClose,
  onAdd,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (ids: number[]) => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const toggle = (id: number, multi: boolean) =>
    setSelected((s) =>
      multi
        ? s.includes(id)
          ? s.filter((x) => x !== id)
          : [...s, id]
        : [
            ...s.filter(
              (x) =>
                !product.modifier_groups
                  .flatMap((g) => g.options)
                  .some((o) => o.id === x && o.id !== id),
            ),
            id,
          ],
    );
  return (
    <div className="modal-backdrop">
      <section className="modal">
        <div className="panel-title">
          <h2>{product.name}</h2>
          <button className="icon-button" onClick={onClose}>
            <X />
          </button>
        </div>
        {product.modifier_groups.map((group) => (
          <div className="modifier-group" key={group.id}>
            <label>
              {group.name} {group.required && <small>Required</small>}
            </label>
            <div className="option-list">
              {group.options.map((option) => (
                <button
                  className={
                    selected.includes(option.id) ? "option selected" : "option"
                  }
                  key={option.id}
                  onClick={() => toggle(option.id, group.multi)}
                >
                  {option.name}
                  <span>
                    {option.price_delta
                      ? `+${money(option.price_delta)}`
                      : "Included"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          className="primary full"
          disabled={product.modifier_groups.some(
            (g) =>
              g.required && !g.options.some((o) => selected.includes(o.id)),
          )}
          onClick={() => onAdd(selected)}
        >
          Add to order
        </button>
      </section>
    </div>
  );
}

function Station({
  station,
  user,
  notify,
}: {
  station: "kitchen" | "bar";
  user: User;
  notify: (m: string, k?: Toast["kind"]) => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const load = async () => {
    try {
      setOrders(await api.orders("?active_only=true"));
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Could not load tickets",
        "error",
      );
    }
  };
  useEffect(() => {
    load();
    const id = window.setInterval(load, 10000);
    return () => window.clearInterval(id);
  }, []);
  const visible = orders
    .map((o) => ({
      ...o,
      items: o.items.filter(
        (i) => i.station === station || i.station === "both",
      ),
    }))
    .filter(
      (o) =>
        o.items.length && !["paid", "cancelled", "void"].includes(o.status),
    );
  const progress = async (order: Order, item: Order["items"][number]) => {
    const next =
      item.status === "new"
        ? "preparing"
        : item.status === "preparing"
          ? "ready"
          : "served";
    try {
      await api.updateOrder(order.id, { item_id: item.id, item_status: next });
      await load();
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Could not update ticket",
        "error",
      );
    }
  };
  return (
    <div className="stack">
      <div className="page-actions">
        <p className="muted">
          Live {station} tickets filtered by product routing.
        </p>
        <button className="secondary" onClick={load}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>
      <div className="ticket-grid">
        {visible.length ? (
          visible.map((order) => (
            <article className="ticket" key={order.id}>
              <div className="ticket-head">
                <div>
                  <span className="eyebrow">Ticket #{order.number}</span>
                  <h2>
                    {order.customer_name ||
                      (order.table_id ? `Table ${order.table_id}` : "Takeaway")}
                  </h2>
                </div>
                <span className={`status ${order.status}`}>
                  {title(order.status)}
                </span>
              </div>
              {order.items.map((item) => (
                <button
                  className="ticket-item"
                  key={item.id}
                  disabled={!can(user, `${station}.serve`)}
                  onClick={() => progress(order, item)}
                >
                  <span className={`item-status ${item.status}`} />{" "}
                  <span>
                    <strong>
                      {item.qty} × {item.name}
                    </strong>
                    <small>
                      {item.modifiers.map((m) => m.name).join(", ") ||
                        item.notes}
                    </small>
                  </span>
                  <em>{title(item.status)}</em>
                </button>
              ))}
            </article>
          ))
        ) : (
          <Empty
            title={`No ${station} tickets`}
            text="New orders routed to this station will appear here."
          />
        )}
      </div>
    </div>
  );
}

function Cashier({
  user,
  notify,
}: {
  user: User;
  notify: (m: string, k?: Toast["kind"]) => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [method, setMethod] = useState("cash");
  const [tendered, setTendered] = useState("");
  const load = async () => {
    try {
      setOrders(await api.orders("?active_only=true"));
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not load bills", "error");
    }
  };
  useEffect(() => {
    load();
  }, []);
  const close = async () => {
    if (!selected) return;
    try {
      await api.closeOrder(selected.id, {
        payment_method: method,
        tendered: Number(tendered || selected.total),
      });
      notify(`Bill #${selected.number} closed`);
      setSelected(null);
      load();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not close bill", "error");
    }
  };
  return (
    <div className="split-view">
      <section className="panel">
        <PanelTitle
          title="Open bills"
          action={
            <button className="secondary" onClick={load}>
              <RefreshCw size={15} />
            </button>
          }
        />
        {orders
          .filter((o) => !["paid", "cancelled", "void"].includes(o.status))
          .map((o) => (
            <button
              className={`list-row ${selected?.id === o.id ? "selected" : ""}`}
              key={o.id}
              onClick={() => setSelected(o)}
            >
              <span>
                <strong>#{o.number}</strong>
                <small>
                  {o.customer_name ||
                    (o.table_id ? `Table ${o.table_id}` : "Takeaway")}{" "}
                  · {o.items.length} items
                </small>
              </span>
              <b>{money(o.total)}</b>
            </button>
          ))}
        {!orders.length && (
          <Empty
            title="No open bills"
            text="Bills created from the POS will appear here."
          />
        )}
      </section>
      <section className="panel">
        {selected ? (
          <>
            <PanelTitle title={`Close bill #${selected.number}`} />
            <div className="order-summary">
              {selected.items.map((item) => (
                <div key={item.id}>
                  <span>
                    {item.qty} × {item.name}
                  </span>
                  <b>{money(item.price * item.qty)}</b>
                </div>
              ))}
              <hr />
              <div>
                <strong>Total</strong>
                <strong>{money(selected.total)}</strong>
              </div>
            </div>
            <label>
              Payment
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile</option>
              </select>
            </label>
            {method === "cash" && (
              <label>
                Tendered
                <input
                  type="number"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  placeholder={selected.total.toFixed(2)}
                />
              </label>
            )}
            <button
              className="primary full"
              disabled={!can(user, "order.close")}
              onClick={close}
            >
              Confirm payment
            </button>
          </>
        ) : (
          <Empty
            title="Select a bill"
            text="Choose an open bill to review and close it."
          />
        )}
      </section>
    </div>
  );
}

function Admin({
  user,
  notify,
}: {
  user: User;
  notify: (m: string, k?: Toast["kind"]) => void;
}) {
  const [tab, setTab] = useState("products");
  const tabs = [
    { id: "products", label: "Products", path: "/api/admin/products" },
    { id: "categories", label: "Categories", path: "/api/admin/categories" },
    { id: "tables", label: "Tables", path: "/api/admin/tables" },
    { id: "users", label: "Users", path: "/api/admin/users" },
    { id: "roles", label: "Roles", path: "/api/admin/roles" },
    { id: "reports", label: "Reports", path: "" },
  ];
  return (
    <div className="stack">
      <div className="tab-bar">
        {tabs
          .filter((t) =>
            t.id === "reports" ? can(user, "admin.reports") : true,
          )
          .map((t) => (
            <button
              className={tab === t.id ? "tab active" : "tab"}
              key={t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
      </div>
      {tab === "reports" ? (
        <Reports notify={notify} />
      ) : (
        <ResourceTable
          kind={tab}
          path={tabs.find((t) => t.id === tab)!.path}
          notify={notify}
        />
      )}
    </div>
  );
}
function ResourceTable({
  kind,
  path,
  notify,
}: {
  kind: string;
  path: string;
  notify: (m: string, k?: Toast["kind"]) => void;
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
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
    <section className="panel">
      <PanelTitle
        title={title(kind)}
        action={
          <button className="secondary" onClick={load}>
            <RefreshCw size={15} />
            Refresh
          </button>
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
  );
}
function Reports({
  notify,
}: {
  notify: (m: string, k?: Toast["kind"]) => void;
}) {
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [period, setPeriod] = useState("day");
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
}: {
  user: User;
  notify: (m: string, k?: Toast["kind"]) => void;
}) {
  const [stock, setStock] = useState<Record<string, unknown>[]>([]);
  const [menu, setMenu] = useState<Menu | null>(null);
  useEffect(() => {
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
  }, []);
  return (
    <section className="panel">
      <PanelTitle title="Inventory" />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Low threshold</th>
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
function Loading() {
  return (
    <div className="loading">
      <RefreshCw className="spin" size={20} />
      Loading workspace…
    </div>
  );
}
function Empty({ title: label, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <Grid3X3 size={24} />
      <strong>{label}</strong>
      <span>{text}</span>
    </div>
  );
}

export default App;
