import { useEffect, useState } from "react";
import {
  Banknote,
  BarChart3,
  ChevronRight,
  CreditCard,
  Package,
  Receipt,
  ShoppingBag,
  Users,
} from "lucide-react";
import type { User } from "../../types";
import { api } from "../../api";
import {
  Empty,
  Loading,
  Metric,
  money,
  PanelTitle,
  type Notify,
} from "../../common";
import {
  ADMIN_MENU,
  type AdminMenuItem,
  type AdminMenuSection,
} from "./menu";

type TodayStats = {
  today_orders: number;
  today_revenue: number;
  open_tickets: number;
  avg_ticket: number;
};

type SalesSummary = {
  period: string;
  total_revenue: number;
  total_orders: number;
  total_items_sold: number;
  avg_order_value: number;
  cogs: number;
  profit: number;
};

type BillRow = {
  order_id: number;
  order_number: number;
  table_name: string | null;
  status: string;
  total: number;
  created_at: string;
};

const RECENT_LIMIT = 6;

export default function AdminDashboard({
  user,
  notify,
  onNavigate,
}: {
  user: User;
  notify: Notify;
  onNavigate: (sectionId: string, itemId: string) => void;
}) {
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [report, setReport] = useState<SalesSummary | null>(null);
  const [recent, setRecent] = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api
        .resource<TodayStats>("/api/orders/_stats/today")
        .catch(() => null),
      api
        .resource<SalesSummary>("/api/admin/reports/sales-summary?period=day")
        .catch(() => null),
      api
        .resource<BillRow[]>("/api/admin/reports/bill-history?period=day")
        .catch(() => [] as BillRow[]),
    ])
      .then(([today, sales, bills]) => {
        if (cancelled) return;
        setStats(today);
        setReport(sales);
        setRecent(bills.slice(0, RECENT_LIMIT));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const jump = (sectionId: string, itemId: string) => () =>
    onNavigate(sectionId, itemId);

  const flatLinks: { section: AdminMenuSection; item: AdminMenuItem }[] = [];
  for (const section of ADMIN_MENU) {
    for (const item of section.items) {
      flatLinks.push({ section, item });
    }
  }
  const linkIcon = (id: string) => {
    if (id === "products" || id === "categories") return ShoppingBag;
    if (id === "tables") return Receipt;
    if (id === "inventory") return Package;
    if (id === "users" || id === "roles") return Users;
    if (id === "reports" || id === "history") return BarChart3;
    return ChevronRight;
  };

  if (loading && !stats) return <Loading />;

  return (
    <div className="stack">
      <div className="panel">
        <PanelTitle
          title="Today at a glance"
          action={
            <button
              className="secondary"
              onClick={() => setRefreshKey((v) => v + 1)}
            >
              Refresh
            </button>
          }
        />
        <div className="metric-grid compact">
          <Metric
            icon={Banknote}
            label="Revenue today"
            value={money(stats?.today_revenue ?? 0)}
          />
          <Metric
            icon={Receipt}
            label="Orders today"
            value={stats?.today_orders ?? 0}
          />
          <Metric
            icon={CreditCard}
            label="Open tickets"
            value={stats?.open_tickets ?? 0}
          />
          <Metric
            icon={BarChart3}
            label="Avg ticket"
            value={money(stats?.avg_ticket ?? 0)}
          />
        </div>
      </div>

      {report && (
        <div className="panel">
          <PanelTitle title="Sales breakdown" />
          <div className="metric-grid compact">
            <Metric
              icon={Package}
              label="Items sold"
              value={report.total_items_sold}
            />
            <Metric
              icon={Banknote}
              label="Profit"
              value={money(report.profit)}
            />
            <Metric
              icon={Receipt}
              label="Cost of goods"
              value={money(report.cogs)}
            />
            <Metric
              icon={BarChart3}
              label="Avg order value"
              value={money(report.avg_order_value)}
            />
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <section className="panel">
          <PanelTitle title="Recent activity" />
          {!recent.length ? (
            <Empty
              title="No activity yet"
              text="Paid bills from today will appear here."
            />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Bill</th>
                    <th>Table</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr key={row.order_id}>
                      <td>#{row.order_number}</td>
                      <td>{row.table_name ?? "—"}</td>
                      <td>{row.status}</td>
                      <td>{money(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="panel">
          <PanelTitle title="Quick links" />
          <div className="admin-menu-column admin-third-menu">
            {flatLinks.map(({ section, item }) => {
              const Icon = linkIcon(item.id);
              return (
                <button
                  key={`${section.id}:${item.id}`}
                  className="admin-menu-item quick-link"
                  onClick={jump(section.id, item.id)}
                >
                  <Icon size={18} />
                  <div className="quick-link-text">
                    <strong>{item.label}</strong>
                    <small>{section.label}</small>
                  </div>
                  <ChevronRight size={16} />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

