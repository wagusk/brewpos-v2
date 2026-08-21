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
import Admin from "./screens/Admin";
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

export default App;
