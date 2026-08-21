import type { Settings as ApiSettings } from "../../types";
import { PanelTitle } from "../../common";
import SettingValue from "./SettingValue";

export default function GeneralSettings({
  settings,
  editable,
  save,
}: {
  settings: ApiSettings;
  editable: boolean;
  save: (path: string, body: unknown) => void;
}) {
  return (
    <>
      <PanelTitle title="Workspace settings" />
      <div className="settings-grid">
        <SettingValue label="Products" value={settings.product_count} />
        <SettingValue label="Users" value={settings.user_count} />
        <SettingValue label="Database" value={settings.db_kind} />
        <label>
          Interface scale
          <input
            type="number"
            min="0.8"
            max="1.5"
            step="0.1"
            defaultValue={settings.text_size}
            onBlur={(e) =>
              editable &&
              save("/text-size", { text_size: Number(e.target.value) })
            }
          />
        </label>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={settings.order_approval_required}
            disabled={!editable}
            onChange={(e) =>
              save("/order-approval", {
                order_approval_required: e.target.checked,
              })
            }
          />{" "}
          Require order approval
        </label>
      </div>
    </>
  );
}
