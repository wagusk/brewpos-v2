import { useState } from "react";
import { X } from "lucide-react";
import { title } from "../../common";
import { ADMIN_FIELDS } from "./fields";

export default function AdminResourceDialog({
  kind,
  row,
  onClose,
  onSave,
  permissionCatalog,
}: {
  kind: string;
  row: Record<string, unknown> | null;
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => Promise<void>;
  permissionCatalog: string[];
}) {
  const fields = ADMIN_FIELDS[kind] ?? [];
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(
      fields.map((field) => [
        field.key,
        field.type === "checkbox"
          ? row?.[field.key] ?? true
          : field.type === "list"
            ? Array.isArray(row?.[field.key])
              ? (row?.[field.key] as unknown[]).join(", ")
              : ""
            : row?.[field.key] ?? "",
      ]),
    ),
  );
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(() =>
    Array.isArray(row?.permissions) ? (row.permissions as string[]) : [],
  );
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      const body = Object.fromEntries(
        fields
          .map((field) => {
            const value = values[field.key];
            if (field.type === "list") {
              if (field.key === "permissions") return [field.key, selectedPermissions];
              return [
                field.key,
                String(value ?? "")
                  .split(",")
                  .map((entry) => entry.trim())
                  .filter(Boolean),
              ];
            }
            if (field.type === "number") return [field.key, Number(value || 0)];
            return [field.key, value];
          })
          .filter(([, value]) => value !== "" && value !== undefined),
      );
      await onSave(body);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="modal-backdrop">
      <section className="modal admin-editor">
        <div className="panel-title">
          <h2>{row ? "Edit " + title(kind) : "Add " + title(kind)}</h2>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="admin-editor-grid">
          {fields.map((field) =>
            field.key === "permissions" && permissionCatalog.length ? (
              <div className="permission-toggle-field" key={field.key}>
                <span>{field.label}</span>
                <div className="permission-toggles">
                  {permissionCatalog.map((permission) => (
                    <label className="permission-toggle" key={permission}>
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission)}
                        onChange={(e) =>
                          setSelectedPermissions((current) =>
                            e.target.checked
                              ? [...current, permission]
                              : current.filter((item) => item !== permission),
                          )
                        }
                      />
                      <span>{title(permission)}</span>
                      <small>{permission}</small>
                    </label>
                  ))}
                </div>
              </div>
            ) : field.type === "checkbox" ? (
              <label className="switch-row" key={field.key}>
                <input
                  type="checkbox"
                  checked={Boolean(values[field.key])}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.checked })
                  }
                />
                {field.label}
              </label>
            ) : (
              <label key={field.key}>
                {field.label}
                <input
                  type={field.type === "number" ? "number" : "text"}
                  value={String(values[field.key] ?? "")}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.value })
                  }
                />
              </label>
            ),
          )}
        </div>
        <div className="button-row">
          <button className="secondary" onClick={onClose}>Cancel</button>
          <button className="primary" disabled={saving} onClick={submit}>
            {saving ? "Saving…" : row ? "Save changes" : "Create"}
          </button>
        </div>
      </section>
    </div>
  );
}
