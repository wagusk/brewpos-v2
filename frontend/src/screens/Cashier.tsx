import { useEffect, useState } from "react";
import {
  CircleDollarSign,
  HandCoins,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import type { Order, User } from "../types";
import { api } from "../api";
import {
  can,
  Empty,
  money,
  PanelTitle,
  title,
  type Notify,
} from "../common";
import { subscribe as wsSubscribe } from "../ws";

export default function Cashier({
  user,
  notify,
}: {
  user: User;
  notify: Notify;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [method, setMethod] = useState("cash");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [tendered, setTendered] = useState("");
  const outstandingFor = (order: Order) =>
    Math.max(
      0,
      order.total -
        order.payments
          .filter((payment) => payment.status === "completed")
          .reduce((sum, payment) => sum + payment.amount, 0),
    );
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
  // Keep the open-bills list in sync with the kitchen/bar. When a kitchen
  // accepts an order (open -> accepted) the bill becomes payable; we want
  // to see that change without waiting for the next user action.
  useEffect(() => {
    const offs = [
      wsSubscribe("order_created", () => load()),
      wsSubscribe("order_updated", () => load()),
      wsSubscribe("order_cancelled", () => load()),
      wsSubscribe("order_deleted", () => load()),
    ];
    return () => offs.forEach((off) => off());
  }, []);
  const close = async () => {
    if (!selected) return;
    try {
      const result = await api.closeOrder(selected.id, {
        payment_method: method,
        amount: Number(paymentAmount || outstandingFor(selected)),
        tendered: Number(tendered || paymentAmount || outstandingFor(selected)),
      });
      notify(
        result.status === "paid"
          ? "Bill #" + selected.number + " closed"
          : "Payment applied to bill #" + selected.number,
      );
      setTendered("");
      if (result.status === "paid") {
        setSelected(null);
        setPaymentAmount("");
      } else {
        setSelected(result);
        setPaymentAmount(outstandingFor(result).toFixed(2));
      }
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not close bill", "error");
    }
  };
  const openOrders = orders.filter(
    (o) => !["paid", "cancelled", "void"].includes(o.status),
  );
  const outstanding = selected ? outstandingFor(selected) : 0;
  const appliedAmount = Number(paymentAmount || outstanding);
  const tenderedAmount = Number(tendered || appliedAmount || 0);
  const change = Math.max(0, tenderedAmount - appliedAmount);
  const isPartialPayment = Boolean(selected) && appliedAmount + 0.005 < outstanding;
  const cashShort =
    Boolean(selected) &&
    method === "cash" &&
    tenderedAmount < appliedAmount;
  return (
    <div className="cashier-workspace">
      <section className="panel cashier-bill-queue">
        <PanelTitle
          title="Open bills"
          action={
            <button className="secondary refresh-button" onClick={load}>
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
          }
        />
        {openOrders.map((o) => (
            <button
              className={`cashier-bill ${selected?.id === o.id ? "selected" : ""}`}
              key={o.id}
              onClick={() => {
                setSelected(o);
                setPaymentAmount(outstandingFor(o).toFixed(2));
                setTendered("");
              }}
            >
              <span className="cashier-bill-icon">
                <ShoppingBag size={18} />
              </span>
              <span className="cashier-bill-info">
                <strong>Bill #{o.number}</strong>
                <small>
                  {o.customer_name ||
                    (o.table_id ? `Table ${o.table_id}` : "Takeaway")}{" "}
                  <span>· {o.items.length} items</span>
                </small>
              </span>
              <span className="cashier-bill-total">{money(o.total)}</span>
            </button>
          ))}
        {!openOrders.length && (
          <Empty
            title="No open bills"
            text="Bills created from the POS will appear here."
          />
        )}
      </section>
      <section className="panel cashier-payment-panel">
        {selected ? (
          <>
            <div className="cashier-payment-heading">
              <div>
                <span className="eyebrow">Ready to settle</span>
                <h2>Bill #{selected.number}</h2>
                <p className="muted">
                  {selected.customer_name ||
                    (selected.table_id ? `Table ${selected.table_id}` : "Takeaway")}
                </p>
              </div>
              <span className={`status ${selected.status}`}>
                {title(selected.status)}
              </span>
            </div>
            <div className="cashier-order-summary">
              {selected.items.map((item) => (
                <div className="cashier-order-line" key={item.id}>
                  <span>
                    {item.qty} × {item.name}
                  </span>
                  <b>{money(item.price * item.qty)}</b>
                </div>
              ))}
              <div className="cashier-total-row">
                <span>Bill total</span>
                <strong>{money(selected.total)}</strong>
              </div>
              <div className="cashier-balance-row">
                <span>Outstanding balance</span>
                <strong>{money(outstanding)}</strong>
              </div>
            </div>
            <label className="cash-tendered">
              Amount to apply
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={outstanding}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={outstanding.toFixed(2)}
              />
            </label>
            <div className="payment-method-section">
              <span className="field-label">Payment method</span>
              <div className="payment-methods">
                {["cash", "card", "mobile"].map((option) => (
                  <button
                    className={`payment-method ${method === option ? "selected" : ""}`}
                    key={option}
                    type="button"
                    onClick={() => setMethod(option)}
                  >
                    <CircleDollarSign size={20} />
                    <span>{title(option)}</span>
                  </button>
                ))}
              </div>
            </div>
            {method === "cash" && (
              <label className="cash-tendered">
                Amount received
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  placeholder={selected.total.toFixed(2)}
                />
                {cashShort && (
                  <small className="payment-warning">
                    {money(appliedAmount - tenderedAmount)} still needed
                  </small>
                )}
              </label>
            )}
            <div className="cashier-payment-result">
              <span>{method === "cash" ? "Change to return" : "Payment due"}</span>
              <strong>{method === "cash" ? money(change) : money(selected.total)}</strong>
            </div>
            <button
              className="primary full cashier-confirm"
              disabled={!can(user, "order.close") || cashShort}
              onClick={close}
            >
              <HandCoins size={20} />
              {isPartialPayment ? "Apply payment" : "Confirm and close bill"}
            </button>
            <p className="cashier-hint">
              {method === "cash"
                ? isPartialPayment
                  ? "This payment will reduce the balance; the same bill remains open."
                  : "Check the amount received before confirming."
                : isPartialPayment
                  ? "This payment will reduce the balance on the same bill."
                  : "Confirm once the customer’s payment has been received."}
            </p>
          </>
        ) : (
          <div className="cashier-empty-payment">
            <span className="cashier-empty-icon">
              <HandCoins size={28} />
            </span>
            <Empty
              title="Select a bill to begin"
              text="Review the order, choose a payment method, and close the bill."
            />
          </div>
        )}
      </section>
    </div>
  );
}
