import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { User } from "../types";
import { api } from "../api";
import { can, type Notify, type Screen } from "../common";
import Inventory from "./Inventory";
import { ADMIN_MENU, pickFirstDetailId, type AdminMenuItem, type AdminMenuSection } from "./admin/menu";
import ResourceTable from "./admin/ResourceTable";
import Reports from "./admin/Reports";
import BillHistory from "./admin/BillHistory";
import AdminDashboard from "./admin/AdminDashboard";

const OVERVIEW_ITEM: AdminMenuItem = { id: "overview", label: "Overview", path: "" };

export default function Admin({
  user,
  notify,
  setScreen,
}: {
  user: User;
  notify: Notify;
  setScreen: (s: Screen) => void;
}) {
  const [sectionId, setSectionId] = useState("catalog");
  const [itemId, setItemId] = useState("overview");
  const [detailId, setDetailId] = useState("default");
  const [refreshKey, setRefreshKey] = useState(0);
  const [permissionCatalog, setPermissionCatalog] = useState<string[]>([]);
  const visibleMenu = ADMIN_MENU.filter(
    (section) =>
      section.id !== "insights" || can(user, "admin.reports") || can(user, "history.view"),
  );
  const section =
    visibleMenu.find((entry) => entry.id === sectionId) ?? visibleMenu[0];
  const itemsWithOverview: AdminMenuItem[] = [OVERVIEW_ITEM, ...section.items];
  const item =
    itemsWithOverview.find((entry) => entry.id === itemId) ??
    itemsWithOverview[0];
  const third = item.third ?? [];
  const selectSection = (nextSection: AdminMenuSection) => {
    setSectionId(nextSection.id);
    setItemId("overview");
    setDetailId(pickFirstDetailId(OVERVIEW_ITEM));
  };
  const selectItem = (nextItem: AdminMenuItem) => {
    setItemId(nextItem.id);
    setDetailId(pickFirstDetailId(nextItem));
  };
  const canViewInventory = can(user, "inventory.view");
  const managePermission =
    item.id === "products" || item.id === "categories"
      ? "admin.manage_menu"
      : item.id === "tables"
        ? "admin.manage_tables"
        : item.id === "inventory"
          ? "admin.manage_menu"
        : item.id === "users" || item.id === "roles"
          ? "admin.manage_users"
          : "admin.reports";
  const canManage = can(user, managePermission);
  useEffect(() => {
    if (!can(user, "admin.manage_users")) return;
    api
      .resource<{ permissions: string[] }>("/api/admin/permissions")
      .then((result) => setPermissionCatalog(result.permissions))
      .catch(() => undefined);
  }, [user]);
  return (
    <div className={third.length ? "admin-workspace has-third" : "admin-workspace"}>
      <aside className="admin-menu-column admin-primary-menu">
        <span className="admin-column-label">Admin</span>
        {visibleMenu.map((entry) => (
          <button
            className={section.id === entry.id ? "admin-menu-item active" : "admin-menu-item"}
            key={entry.id}
            onClick={() => selectSection(entry)}
          >
            <strong>{entry.label}</strong>
            <small>{entry.description}</small>
          </button>
        ))}
      </aside>
      <aside className="admin-menu-column">
        <span className="admin-column-label">{section.label}</span>
        {itemsWithOverview
        .filter((entry) =>
          (entry.id !== "inventory" || canViewInventory) &&
          (entry.id !== "reports" || can(user, "admin.reports")) &&
          (entry.id !== "history" || can(user, "history.view")),
        )
          .map((entry) => (
            <button
              className={item.id === entry.id ? "admin-menu-item active" : "admin-menu-item"}
              key={entry.id}
              onClick={() => selectItem(entry)}
            >
              <strong>{entry.label}</strong>
              <small>
                {entry.id === "overview"
                  ? "Workspace snapshot"
                  : entry.id === "reports"
                    ? "Choose a reporting period"
                    : "Manage records"}
              </small>
            </button>
          ))}
      </aside>
      {third.length > 0 && (
        <aside className="admin-menu-column admin-third-menu">
          <span className="admin-column-label">View</span>
          {third.map((entry) => (
            <button
              className={detailId === entry.id ? "admin-menu-item active" : "admin-menu-item"}
              key={entry.id}
              onClick={() => setDetailId(entry.id)}
            >
              <strong>{entry.label}</strong>
            </button>
          ))}
        </aside>
      )}
      <section className="admin-details">
        <div className="admin-details-header">
          <div>
            <span className="eyebrow">{section.label} / {item.label}</span>
            <h2>{item.label}</h2>
          </div>
          <div className="admin-details-actions">
            <button className="secondary" onClick={() => setRefreshKey((value) => value + 1)}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button className="primary" onClick={() => setScreen("pos")}>
              Open POS
            </button>
          </div>
        </div>
        {item.id === "overview" ? (
          <AdminDashboard
            key={refreshKey}
            user={user}
            notify={notify}
            onNavigate={(sectionId, targetItemId) => {
              setSectionId(sectionId);
              setItemId(targetItemId);
              const targetSection = ADMIN_MENU.find((s) => s.id === sectionId);
              const targetItem = targetSection?.items.find(
                (entry) => entry.id === targetItemId,
              );
              setDetailId(pickFirstDetailId(targetItem ?? OVERVIEW_ITEM));
              setRefreshKey((v) => v + 1);
            }}
          />
        ) : item.id === "reports" ? (
          <Reports key={refreshKey + detailId} notify={notify} selectedPeriod={detailId} />
        ) : item.id === "history" ? (
          <BillHistory key={refreshKey} notify={notify} />
        ) : item.id === "inventory" ? (
          <Inventory key={refreshKey} notify={notify} editable={canManage} />
        ) : (
          <ResourceTable
            key={refreshKey}
            kind={item.id}
            path={item.path}
            notify={notify}
            canManage={canManage}
            permissionCatalog={permissionCatalog}
          />
        )}
      </section>
    </div>
  );
}
