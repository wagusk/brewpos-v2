import { useEffect, useState } from "react";
import { Pencil, RefreshCw } from "lucide-react";
import type { Menu } from "../types";
import { api } from "../api";
import { Empty, PanelTitle, type Notify, type Toast } from "../common";

export default function Inventory({
  notify,
  editable,
}: {
  notify: Notify;
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
