import { useEffect, useState } from "react";
import {
  BarChart3,
  ChefHat,
  CircleDollarSign,
  Eye,
  FileText,
  RefreshCw,
} from "lucide-react";
import type { Table, User } from "../types";
import { api } from "../api";
import {
  can,
  Metric,
  money,
  PanelTitle,
  title,
  type Screen,
  type Toast,
} from "../common";

type Notify = (m: string, k?: Toast["kind"]) => void;

export default function Dashboard({
  user,
  notify,
  setScreen,
}: {
  user: User;
  notify: Notify;
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
