import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackagePlus, ShoppingCart, FileText } from "lucide-react";
import { getDashboardStats, money, type Announcement } from "../lib/db";
import { formatDate } from "../lib/format";
import { useAuth } from "../hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalParts: 0,
    totalUnits: 0,
    stockValue: 0,
    revenue: 0,
    profit: 0,
    salesCount: 0,
    announcements: [] as Announcement[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="page-title">Visão Geral</h1>
      <p className="page-sub">
        Olá, {user?.name?.split(" ")[0] || "utilizador"}. Dados locais neste dispositivo.
      </p>

      <div className="fab-row no-print mb-2">
        <Link to="/sales/new" className="btn btn-success btn-sm">
          <ShoppingCart size={16} /> Nova Venda
        </Link>
        <Link to="/inventory/new" className="btn btn-primary btn-sm">
          <PackagePlus size={16} /> Nova Peça
        </Link>
        <Link to="/reports" className="btn btn-ghost btn-sm">
          <FileText size={16} /> Relatórios
        </Link>
      </div>

      {loading ? (
        <div className="empty">A carregar estatísticas…</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat">
              <label>Peças no catálogo</label>
              <strong>{stats.totalParts}</strong>
              <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                {stats.totalUnits} unidades em stock
              </div>
            </div>
            <div className="stat emerald">
              <label>Receita total</label>
              <strong>{money(stats.revenue)}</strong>
              <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                {stats.salesCount} vendas
              </div>
            </div>
            <div className="stat purple">
              <label>Lucro estimado</label>
              <strong>{money(stats.profit)}</strong>
            </div>
          </div>

          <div className="card mt-2" style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
            <div className="flex-between mb-1">
              <h3 style={{ margin: 0, color: "#92400e" }}>Comunicados</h3>
            </div>
            {stats.announcements.length === 0 ? (
              <p className="text-muted" style={{ margin: 0 }}>
                Nenhum comunicado no momento.
              </p>
            ) : (
              <div className="stack">
                {stats.announcements.map((a) => (
                  <div key={a.id} style={{ background: "white", borderRadius: 12, padding: "0.75rem" }}>
                    <div>{a.message}</div>
                    <div className="text-muted" style={{ fontSize: "0.75rem", marginTop: 6 }}>
                      {formatDate(a.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
