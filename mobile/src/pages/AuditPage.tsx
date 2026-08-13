import { useEffect, useState } from "react";
import { listAuditLogs, listStockMovements, type AuditLog, type StockMovement } from "../lib/db";
import { AdminOnly } from "../components/AdminOnly";
import { formatDate } from "../lib/format";

function Body() {
  const [tab, setTab] = useState<"audit" | "stock">("audit");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [moves, setMoves] = useState<StockMovement[]>([]);

  useEffect(() => {
    listAuditLogs(150).then(setLogs);
    listStockMovements(150).then(setMoves);
  }, []);

  return (
    <div>
      <h1 className="page-title">Auditoria</h1>
      <p className="page-sub">Registo de ações e movimentos de stock.</p>

      <div className="fab-row mb-2">
        <button
          type="button"
          className={`btn btn-sm ${tab === "audit" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("audit")}
        >
          Ações
        </button>
        <button
          type="button"
          className={`btn btn-sm ${tab === "stock" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("stock")}
        >
          Mov. stock
        </button>
      </div>

      {tab === "audit" ? (
        <div className="list">
          {logs.map((l) => (
            <div key={l.id} className="list-item">
              <div className="meta">
                <h3>{l.action}</h3>
                <p>
                  {l.userName || "Sistema"} · {formatDate(l.createdAt)}
                </p>
                {l.details && <p style={{ marginTop: 4 }}>{l.details}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="list">
          {moves.map((m) => (
            <div key={m.id} className="list-item">
              <div className="meta">
                <h3>
                  {m.partName} · {m.type}
                </h3>
                <p>
                  {m.previousStock} → {m.newStock} ({m.quantity > 0 ? "+" : ""}
                  {m.quantity}) · {formatDate(m.createdAt)}
                </p>
                {m.reason && <p style={{ marginTop: 4 }}>{m.reason}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  return (
    <AdminOnly>
      <Body />
    </AdminOnly>
  );
}
