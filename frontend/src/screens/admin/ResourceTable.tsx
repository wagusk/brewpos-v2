import { useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { api } from "../../api";
import { Empty, Loading, money, PanelTitle, title, type Notify } from "../../common";
import AdminResourceDialog from "./AdminResourceDialog";

export default function ResourceTable({
  kind,
  path,
  notify,
  canManage,
  permissionCatalog,
}: {
  kind: string;
  path: string;
  notify: Notify;
  canManage: boolean;
  permissionCatalog: string[];
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<Record<string, unknown> | "new" | null>(null);
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
  const save = async (body: Record<string, unknown>) => {
    try {
      const isNew = editor === "new";
      const endpoint = isNew ? path : path + "/" + String(editor?.id);
      await api.mutate(endpoint, isNew ? "POST" : "PATCH", body);
      notify(isNew ? title(kind) + " created" : title(kind) + " updated");
      setEditor(null);
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not save record", "error");
    }
  };
  const remove = async (row: Record<string, unknown>) => {
    if (!window.confirm("Delete this " + title(kind).toLowerCase() + "?")) return;
    try {
      await api.mutate(path + "/" + String(row.id), "DELETE");
      notify(title(kind) + " deleted");
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not delete record", "error");
    }
  };
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
    <>
    <section className="panel">
      <PanelTitle
        title={title(kind)}
        action={
          <div className="admin-table-actions">
            {canManage && (
              <button className="primary" onClick={() => setEditor("new")}>
                <Plus size={16} /> Add
              </button>
            )}
            <button className="secondary" onClick={load}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
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
                {canManage && <th>Actions</th>}
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
                  {canManage && (
                    <td>
                      <div className="row-actions">
                        <button className="icon-button" title="Edit" onClick={() => setEditor(row)}>
                          <Pencil size={16} />
                        </button>
                        <button className="icon-button danger-icon" title="Delete" onClick={() => remove(row)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
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
    {editor !== null && (
      <AdminResourceDialog
        kind={kind}
        row={editor === "new" ? null : editor}
        onClose={() => setEditor(null)}
        onSave={save}
        permissionCatalog={permissionCatalog}
      />
    )}
    </>
  );
}
