import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "../lib/enterprise";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../lib/format";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AppNotification[]>([]);

  const load = async () => {
    if (!user) return;
    setRows(await listNotifications(user.id, 100));
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const levelColor = (l: string) => {
    if (l === "CRITICAL") return "badge-red";
    if (l === "ATTENTION") return "badge-orange";
    if (l === "WARNING") return "badge-orange";
    return "badge-blue";
  };

  return (
    <div>
      <div className="flex-between">
        <div>
          <h1 className="page-title">Notificações</h1>
          <p className="page-sub">Alertas internos do sistema.</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={async () => {
            if (!user) return;
            await markAllNotificationsRead(user.id);
            await load();
          }}
        >
          Marcar lidas
        </button>
      </div>

      <div className="list">
        {rows.length === 0 ? (
          <div className="card empty">
            <Bell size={24} color="#94a3b8" />
            <div>Sem notificações.</div>
          </div>
        ) : (
          rows.map((n) => (
            <button
              key={n.id}
              type="button"
              className="list-item"
              style={{
                width: "100%",
                textAlign: "left",
                opacity: n.read ? 0.7 : 1,
                background: n.read ? undefined : "#eff6ff",
              }}
              onClick={async () => {
                if (n.id) await markNotificationRead(n.id);
                await load();
              }}
            >
              <div className="meta">
                <h3>{n.title}</h3>
                <p>{n.body}</p>
                <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`badge ${levelColor(n.level)}`}>{n.level}</span>
                  <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                    {formatDate(n.createdAt)}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
