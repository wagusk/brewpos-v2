import { useEffect, useState } from "react";
import { api } from "../../api";
import { Empty, Loading, money, PanelTitle, type Notify } from "../../common";

export default function BillHistory({ notify }: { notify: Notify }) {
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
