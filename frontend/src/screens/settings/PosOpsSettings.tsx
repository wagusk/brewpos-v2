import { useState } from "react";
import type { PosOpsSettings as PosOps } from "../../types";
import { PanelTitle } from "../../common";

const STATIONS = [
  { value: "kitchen", label: "Kitchen" },
  { value: "bar", label: "Bar" },
  { value: "both", label: "Both" },
];

export default function PosOpsSettings({
  posOps,
  save,
  editable,
}: {
  posOps: PosOps;
  save: (v: Partial<PosOps>) => void;
  editable: boolean;
}) {
  const [draft, setDraft] = useState<PosOps>(posOps);
  const dirty =
    draft.auto_print_on_send_to_kitchen !==
      posOps.auto_print_on_send_to_kitchen ||
    draft.auto_print_on_payment !== posOps.auto_print_on_payment ||
    draft.default_station !== posOps.default_station ||
    draft.terminal_name !== posOps.terminal_name ||
    draft.terminal_location !== posOps.terminal_location;

  const reset = () => setDraft(posOps);

  const commit = () => {
    save({
      auto_print_on_send_to_kitchen: draft.auto_print_on_send_to_kitchen,
      auto_print_on_payment: draft.auto_print_on_payment,
      default_station: draft.default_station,
      terminal_name: draft.terminal_name,
      terminal_location: draft.terminal_location,
    });
  };

  return (
    <>
      <PanelTitle
        title="POS operations"
        action={
          <div className="button-row">
            <button
              className="secondary"
              disabled={!editable || !dirty}
              onClick={reset}
            >
              Reset
            </button>
            <button
              className="primary"
              disabled={!editable || !dirty}
              onClick={commit}
            >
              Save
            </button>
          </div>
        }
      />
      <div className="settings-grid">
        <label>
          Terminal name
          <input
            type="text"
            maxLength={80}
            value={draft.terminal_name}
            disabled={!editable}
            onChange={(e) =>
              setDraft({ ...draft, terminal_name: e.target.value })
            }
            placeholder="Front Counter"
          />
        </label>
        <label>
          Terminal location
          <input
            type="text"
            maxLength={120}
            value={draft.terminal_location}
            disabled={!editable}
            onChange={(e) =>
              setDraft({ ...draft, terminal_location: e.target.value })
            }
            placeholder="e.g. Lobby, Patio"
          />
        </label>
        <label>
          Default station for new products
          <select
            value={draft.default_station}
            disabled={!editable}
            onChange={(e) =>
              setDraft({ ...draft, default_station: e.target.value })
            }
          >
            {STATIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={draft.auto_print_on_send_to_kitchen}
            disabled={!editable}
            onChange={(e) =>
              setDraft({
                ...draft,
                auto_print_on_send_to_kitchen: e.target.checked,
              })
            }
          />{" "}
          Auto-print kitchen ticket
        </label>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={draft.auto_print_on_payment}
            disabled={!editable}
            onChange={(e) =>
              setDraft({ ...draft, auto_print_on_payment: e.target.checked })
            }
          />{" "}
          Auto-print receipt on payment
        </label>
      </div>
    </>
  );
}
