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
import SettingsPage from "./screens/Settings";
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




export default App;
