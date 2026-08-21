import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { api } from "../../api";
import { Metric, money, PanelTitle, title, type Notify } from "../../common";

export default function Reports({
  notify,
  selectedPeriod = "day",
}: {
  notify: Notify;
  selectedPeriod?: string;
}) {
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [period, setPeriod] = useState(selectedPeriod);
  useEffect(() => {
    api
      .resource<Record<string, unknown>>(
        `/api/admin/reports/sales-summary?period=${period}`,
      )
      .then(setReport)
      .catch((e) =>
        notify(
          e instanceof Error ? e.message : "Could not load report",
          "error",
        ),
      );
  }, [period]);
  return (
    <section className="panel">
      <PanelTitle title="Sales report" />
      <div className="inline-form">
        <label>
          Period
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="day">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="all">All time</option>
          </select>
        </label>
      </div>
      <div className="metric-grid compact">
        {report &&
          Object.entries(report)
            .filter(([key]) => key !== "period")
            .map(([key, value]) => (
              <Metric
                key={key}
                label={title(key)}
                value={
                  key.includes("revenue") ||
                  key.includes("value") ||
                  key === "cogs" ||
                  key === "profit"
                    ? money(Number(value))
                    : Number(value)
                }
                icon={BarChart3}
              />
            ))}
      </div>
    </section>
  );
}
