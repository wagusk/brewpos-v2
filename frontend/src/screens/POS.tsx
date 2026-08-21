import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Grid3X3, RefreshCw, X } from "lucide-react";
import type { Menu, Order, Product, Table, User } from "../types";
import { api } from "../api";
import { can, Loading, money, PanelTitle, type Notify, type Toast } from "../common";
import { subscribe as wsSubscribe } from "../ws";

type CartLine = {
  product: Product;
  qty: number;
  modifiers: number[];
  notes: string;
};

export default function POS({
  user,
  notify,
}: {
  user: User;
  notify: Notify;
}) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [category, setCategory] = useState<number | null>(null);
  const [tableId, setTableId] = useState<number | "">("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [bill, setBill] = useState<Order | null>(null);
  const [customer, setCustomer] = useState("");
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [posView, setPosView] = useState<"tables" | "ordering">("tables");
  const [pendingTable, setPendingTable] = useState<Table | null>(null);
  const [tablesLoaded, setTablesLoaded] = useState(false);
  const load = async () => {
    try {
      const [m, t] = await Promise.all([api.menu(), api.tables()]);
      setMenu(m);
      setTables(t);
      if (category === null && m.categories[0]) setCategory(m.categories[0].id);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not load menu", "error");
    } finally {
      setTablesLoaded(true);
    }
  };
  useEffect(() => {
    load();
  }, []);
  // Refresh menu + tables when ANY order or table changes elsewhere
  // (cashier closes a bill, kitchen accepts, admin edits a table).
  useEffect(() => {
    const offs = [
      wsSubscribe("order_created", () => load()),
      wsSubscribe("order_updated", () => load()),
      wsSubscribe("order_cancelled", () => load()),
      wsSubscribe("order_deleted", () => load()),
      wsSubscribe("table_created", () => load()),
      wsSubscribe("table_updated", () => load()),
      wsSubscribe("table_deleted", () => load()),
    ];
    return () => offs.forEach((off) => off());
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
    if (!cart.length || busy) return null;
    setBusy(true);
    try {
      const existingOrderId = orderId;
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
      };
      const result = existingOrderId
        ? await api.appendItems(existingOrderId, { items: body.items })
        : await api.checkout(body);
      setOrderId(result.id);
      setBill(result);
      setCart([]);
      notify(
        existingOrderId
          ? `New order added to bill #${result.number}`
          : `Order #${result.number} saved`,
      );
      await load();
      return result;
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not save order", "error");
      return null;
    } finally {
      setBusy(false);
    }
  };
  const saveBill = async () => {
    if (!cart.length || busy) return;
    const result = await submit();
    if (!result) return;

    // A bill that is already being prepared can receive more items without
    // going through the initial open -> accepted transition again. The
    // append response is already the authoritative bill state in that case.
    if (result.status !== "open") return;

    setBusy(true);
    try {
      const accepted = await api.acceptOrder(result.id);
      setBill(accepted);
      notify(`Bill #${accepted.number} sent to kitchen and bar`);
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not send bill", "error");
    } finally {
      setBusy(false);
    }
  };
  // Print ticket (kitchen/bar) or receipt (paid orders)
  const printBill = async () => {
    if (!orderId || busy) return;
    setBusy(true);
    try {
      const result =
        bill?.status === "paid"
          ? await api.printReceipt(orderId)
          : await api.printTicket(orderId);
      notify(
        bill?.status === "paid"
          ? "Customer receipt sent to printer"
          : `Ticket sent to printer (${result.ok ? "ok" : result.error ?? "no printer"})`,
      );
    } catch (e) {
      notify(e instanceof Error ? e.message : "Print failed", "error");
    } finally {
      setBusy(false);
    }
  };
  // Cancel an open bill (only possible before kitchen acceptance)
  const cancelBill = async () => {
    if (!orderId || busy) return;
    const reason =
      window.prompt("Reason for cancellation (required)") ?? "";
    if (!reason.trim()) return;
    setBusy(true);
    try {
      const order = await api.cancelOrder(orderId, { reason });
      setBill(order);
      setOrderId(null);
      setTableId("");
      notify(`Bill #${order.number} cancelled`);
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Cancel failed", "error");
    } finally {
      setBusy(false);
    }
  };
  const selectTable = (table: Table) => {
    setTableId(table.id);
    if (table.order_id) {
      setOrderId(table.order_id);
      api.order(table.order_id)
        .then((order) => {
          setBill(order);
          setCustomer(order.customer_name || order.notes || "");
          setPosView("ordering");
        })
        .catch((e) => notify(e instanceof Error ? e.message : "Could not load bill", "error"));
    } else {
      setPendingTable(table);
    }
  };
  const openBill = async () => {
    if (!pendingTable || busy) return;
    if (!can(user, "order.open")) {
      notify("You do not have permission to open a bill", "error");
      setPendingTable(null);
      return;
    }
    setBusy(true);
    try {
      const order = await api.openBill({ table_id: pendingTable.id, type: "dine_in" });
      setTableId(pendingTable.id);
      setOrderId(order.id);
      setBill(order);
      setCustomer(order.customer_name || order.notes || "");
      setPendingTable(null);
      setPosView("ordering");
      await load();
      notify(`Bill #${order.number} opened`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not open bill", "error");
    } finally {
      setBusy(false);
    }
  };
  if (!menu || !tablesLoaded) return <Loading />;
  if (posView === "tables") {
    return (
      <div className="pos-table-selection">
        <div className="page-actions">
          <div>
            <p className="eyebrow">Point of sale</p>
            <h2>Select a table</h2>
            <p className="muted">Choose an empty table to open a bill or an occupied table to continue ordering.</p>
          </div>
          <button className="secondary" onClick={load}><RefreshCw size={16} /> Refresh</button>
        </div>
        <div className="pos-table-grid">
          {tables.filter((table) => table.active).map((table) => (
            <button
              className={`pos-table-card ${table.order_id ? "occupied" : "available"}`}
              key={table.id}
              onClick={() => selectTable(table)}
            >
              <span className="pos-table-number">{table.name}</span>
              <strong>{table.order_id ? `Bill #${table.order_number}` : "Available"}</strong>
              <small>{table.order_id ? `${table.items_count ?? 0} items · ${money(table.order_total ?? 0)}` : `${table.seats} seats`}</small>
            </button>
          ))}
        </div>
        {pendingTable && (
          <div className="modal-backdrop">
            <section className="modal table-open-dialog">
              <div className="panel-title"><h2>Open bill</h2><button className="icon-button" onClick={() => setPendingTable(null)}><X size={18} /></button></div>
              <p>Open a new bill for <strong>{pendingTable.name}</strong>?</p>
              <div className="button-row">
                <button className="secondary" onClick={() => setPendingTable(null)}>No</button>
                <button className="primary" disabled={busy} onClick={openBill}>{busy ? "Opening…" : "Yes, open bill"}</button>
              </div>
            </section>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="pos-layout">
      <aside className="cart-panel bill-panel">
        <div className="bill-heading-row">
          <strong>{tables.find((table) => table.id === tableId)?.name ?? "Table"}</strong>
          <strong>Bill #{bill?.number ?? orderId ?? "—"}</strong>
        </div>
        <label className="bill-note-field">
          Customer name / bill notes
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Optional customer name or note"
          />
        </label>
        <div className="bill-items-scroll">
          <div className="bill-history">
            <span className="bill-section-label">Past order · read only</span>
            {bill?.items?.length ? bill.items.map((item) => (
              <div className="bill-line" key={item.id}>
                <div><strong>{item.qty}× {item.name}</strong><small>{item.status}</small></div>
                <b>{money(item.price * item.qty)}</b>
              </div>
            )) : <p className="muted bill-empty">No past items on this bill.</p>}
          </div>
          <div className="bill-new-items">
          <PanelTitle
            title="New items"
            action={
              cart.length ? (
                <button className="icon-button" onClick={() => setCart([])}>
                  <X size={17} />
                </button>
              ) : undefined
            }
          />
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
                    <button onClick={() => setCart((c) => c.flatMap((x, i) => i === index ? x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : [] : [x]))}>−</button>
                    <span>{line.qty}</span>
                    <button onClick={() => setCart((c) => c.map((x, i) => i === index ? { ...x, qty: x.qty + 1 } : x))}>+</button>
                  </div>
                  <b>{money(line.product.price * line.qty)}</b>
                </div>
              ))
            ) : (
              <p className="muted bill-empty">Select menu items to add a new order to this bill.</p>
            )}
          </div>
          <div className="cart-total">
            <span>New items</span>
            <strong>{money(subtotal)}</strong>
          </div>
          </div>
        </div>
        <div className="bill-total"><span>Bill total</span><strong>{money(bill?.total ?? 0)}</strong></div>
        <div className="bill-actions-grid">
          <button
            className="primary"
            disabled={
              !cart.length ||
              busy ||
              !can(user, orderId ? "order.append" : "order.open")
            }
            onClick={saveBill}
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            className="secondary"
            disabled={!orderId || busy}
            onClick={printBill}
          >
            {bill?.status === "paid" ? "Receipt" : "Print"}
          </button>
          <button
            className="secondary"
            disabled={!orderId || busy || bill?.status === "paid"}
            onClick={cancelBill}
          >
            Cancel
          </button>
        </div>
      </aside>
      <section className="pos-menu">
        <div className="page-actions">
          <div>
            <button className="secondary" onClick={() => { setPosView("tables"); setCart([]); }}>
              <Grid3X3 size={16} /> Tables
            </button>
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
              style={
                {
                  "--product-color": menu.categories.find(
                    (c) => c.id === product.category_id,
                  )?.color,
                } as CSSProperties
              }
              onClick={() =>
                product.modifier_groups.length
                  ? setModifierProduct(product)
                  : addProduct(product)
              }
            >
              <strong>{product.name}</strong>
              <small>{product.description || " "}</small>
              <b>{money(product.price)}</b>
            </button>
          ))}
        </div>
      </section>
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
