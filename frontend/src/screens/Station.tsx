import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { Order, User } from "../types";
import { api } from "../api";
import { can, Empty, title, type Toast } from "../common";

type Notify = (m: string, k?: Toast["kind"]) => void;
type StationKind = "kitchen" | "bar";

export default function Station({
  station,
  user,
  notify,
}: {
  station: StationKind;
  user: User;
  notify: Notify;
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
