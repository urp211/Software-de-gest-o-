import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PackagePlus,
  ShoppingCart,
  FileText,
  AlertTriangle,
  Wallet,
  TrendingUp,
} from "lucide-react";
import {
  getDashboardStats,
  money,
  moneyShort,
  type Announcement,
  type Part,
} from "../lib/db";
import { formatDate } from "../lib/format";
import { useAuth } from "../hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [stats, setStats] = useState({
    totalParts: 0,
    totalUnits: 0,
    stockValue: 0,
    revenue: 0,
    profit: 0,
    netProfit: 0,
    expenses: 0,
    salesCount: 0,
    todaySales: 0,
    todayRevenue: 0,
    todayProfit: 0,
    lowStock: [] as Part[],
    announcements: [] as Announcement[],
    isAdmin: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getDashboardStats({ role: user.role, userId: user.id })
      .then(setStats)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div>
      <h1 className="page-title">Visão Geral</h1>
      <p className="page-sub">
        Olá, {user?.name?.split(" ")[0] || "utilizador"}.
        {isAdmin
          ? " Painel completo de administração."
          : " A ver apenas as suas operações (sem lucros globais)."}
      </p>

      <div className="fab-row no-print mb-2">
        <Link to="/sales/new" className="btn btn-success btn-sm">
          <ShoppingCart size={16} /> Nova Venda
        </Link>
        {isAdmin && (
          <Link to="/inventory/new" className="btn btn-primary btn-sm">
            <PackagePlus size={16} /> Nova Peça
          </Link>
        )}
        <Link to="/accounting" className="btn btn-ghost btn-sm">
          <TrendingUp size={16} /> {isAdmin ? "Contabilidade" : "Meu desempenho"}
        </Link>
        <Link to="/reports" className="btn btn-ghost btn-sm">
          <FileText size={16} /> Relatórios
        </Link>
      </div>

      {loading ? (
        <div className="empty">A carregar…</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat">
              <label>{isAdmin ? "Peças no catálogo" : "Vendas hoje"}</label>
              <strong>{isAdmin ? stats.totalParts : stats.todaySales}</strong>
              <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                {isAdmin
                  ? `${stats.totalUnits} unidades em stock`
                  : `Hoje: ${moneyShort(stats.todayRevenue)}`}
              </div>
            </div>
            <div className="stat emerald">
              <label>{isAdmin ? "Receita total" : "A minha receita"}</label>
              <strong>{money(stats.revenue)}</strong>
              <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                {stats.salesCount} vendas
              </div>
            </div>
            {isAdmin ? (
              <div className="stat purple">
                <label>Lucro líquido</label>
                <strong>{money(stats.netProfit)}</strong>
                <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                  Bruto {moneyShort(stats.profit)} − Desp. {moneyShort(stats.expenses)}
                </div>
              </div>
            ) : (
              <div className="stat amber">
                <label>Receita de hoje</label>
                <strong>{money(stats.todayRevenue)}</strong>
              </div>
            )}
          </div>

          {isAdmin && stats.lowStock.length > 0 && (
            <div className="card mt-2" style={{ borderColor: "#fcd34d", background: "#fffbeb" }}>
              <div className="flex-between mb-1">
                <strong style={{ display: "flex", gap: 8, alignItems: "center", color: "#b45309" }}>
                  <AlertTriangle size={18} /> Stock baixo ({stats.lowStock.length})
                </strong>
                <Link to="/inventory" className="btn btn-ghost btn-sm">
                  Ver
                </Link>
              </div>
              <div className="list">
                {stats.lowStock.slice(0, 5).map((p) => (
                  <div key={p.id} className="list-item" style={{ padding: "0.55rem" }}>
                    <div className="meta">
                      <h3 style={{ fontSize: "0.9rem" }}>{p.name}</h3>
                      <p>{p.trackingCode}</p>
                    </div>
                    <strong style={{ color: "#dc2626" }}>{p.stock}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="stats-grid mt-2">
              <div className="stat">
                <label>Valor stock (venda)</label>
                <strong style={{ fontSize: "1.2rem" }}>{moneyShort(stats.stockValue)}</strong>
              </div>
              <div className="stat">
                <label>
                  <Wallet size={14} style={{ verticalAlign: "middle" }} /> Despesas
                </label>
                <strong style={{ fontSize: "1.2rem" }}>{moneyShort(stats.expenses)}</strong>
              </div>
            </div>
          )}

          <div className="card mt-2" style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
            <h3 style={{ margin: "0 0 0.75rem", color: "#92400e" }}>Comunicados</h3>
            {stats.announcements.length === 0 ? (
              <p className="text-muted" style={{ margin: 0 }}>
                Nenhum comunicado.
              </p>
            ) : (
              <div className="stack">
                {stats.announcements.map((a) => (
                  <div
                    key={a.id}
                    style={{ background: "white", borderRadius: 12, padding: "0.75rem" }}
                  >
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
