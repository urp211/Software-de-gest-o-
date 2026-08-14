import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PackagePlus,
  ShoppingCart,
  FileText,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Users,
  Truck,
  Bell,
  Banknote,
} from "lucide-react";
import { money, moneyShort } from "../lib/db";
import { getEnterpriseKpis } from "../lib/enterprise";
import { useAuth } from "../hooks/useAuth";
import { getNetworkStatus, notifyLocal } from "../lib/device";
import { formatDate } from "../lib/format";

export default function DashboardPage() {
  const { user, can } = useAuth();
  const [k, setK] = useState<Awaited<ReturnType<typeof getEnterpriseKpis>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [net, setNet] = useState("…");

  useEffect(() => {
    if (!user) return;
    getEnterpriseKpis(user.role, user.id)
      .then(async (s) => {
        setK(s);
        if (s.lowStock.length > 0 && can("inventory.view")) {
          const key = `lowstock_notified_${new Date().toDateString()}`;
          if (!sessionStorage.getItem(key)) {
            await notifyLocal(
              "Stock baixo — MAKINA",
              `${s.lowStock.length} produto(s) abaixo do mínimo.`
            );
            sessionStorage.setItem(key, "1");
          }
        }
      })
      .finally(() => setLoading(false));
    getNetworkStatus().then((n) =>
      setNet(n.connected ? `Rede: ${n.connectionType}` : "Modo offline")
    );
  }, [user, can]);

  if (!user) return null;

  return (
    <div>
      <h1 className="page-title">Dashboard empresarial</h1>
      <p className="page-sub">
        Olá, {user.name?.split(" ")[0]}. Indicadores em tempo real · {net}
      </p>

      <div className="fab-row no-print mb-2">
        {can("sales.create") && (
          <Link to="/sales/new" className="btn btn-success btn-sm">
            <ShoppingCart size={16} /> Nova Venda
          </Link>
        )}
        {can("inventory.create") && (
          <Link to="/inventory/new" className="btn btn-primary btn-sm">
            <PackagePlus size={16} /> Produto
          </Link>
        )}
        {can("reports.view") && (
          <Link to="/accounting" className="btn btn-ghost btn-sm">
            <TrendingUp size={16} /> Indicadores
          </Link>
        )}
        <Link to="/notifications" className="btn btn-ghost btn-sm">
          <Bell size={16} /> Alertas
          {k && k.unreadNotifications > 0 ? ` (${k.unreadNotifications})` : ""}
        </Link>
      </div>

      {loading || !k ? (
        <div className="empty">A carregar indicadores…</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat emerald">
              <label>Faturação hoje</label>
              <strong>{money(k.dayRevenue)}</strong>
              <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                {k.daySales} vendas
              </div>
            </div>
            <div className="stat">
              <label>Faturação do mês</label>
              <strong>{money(k.monthRevenue)}</strong>
              <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                {k.monthSales} vendas
              </div>
            </div>
            {k.seeProfit ? (
              <div className="stat purple">
                <label>Lucro líquido est.</label>
                <strong>{money(k.netProfit)}</strong>
                <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                  Desp. {moneyShort(k.expenses)}
                </div>
              </div>
            ) : (
              <div className="stat amber">
                <label>As minhas vendas</label>
                <strong>{k.salesCount}</strong>
              </div>
            )}
          </div>

          <div className="stats-grid mt-2">
            <div className="stat">
              <label>Stock (SKUs / un.)</label>
              <strong style={{ fontSize: "1.25rem" }}>
                {k.stockSkus} / {k.stockUnits}
              </strong>
            </div>
            <div className="stat">
              <label>
                <Users size={14} /> Clientes
              </label>
              <strong style={{ fontSize: "1.25rem" }}>{k.clients}</strong>
            </div>
            <div className="stat">
              <label>
                <Truck size={14} /> Fornecedores
              </label>
              <strong style={{ fontSize: "1.25rem" }}>{k.suppliers}</strong>
            </div>
            <div className="stat">
              <label>
                <Wallet size={14} /> Caixas abertas
              </label>
              <strong style={{ fontSize: "1.25rem" }}>{k.openCashSessions}</strong>
            </div>
          </div>

          {(k.overduePayables > 0 ||
            k.overdueReceivables > 0 ||
            k.dueSoon > 0 ||
            k.lowStock.length > 0) && (
            <div className="card mt-2" style={{ borderColor: "#fcd34d", background: "#fffbeb" }}>
              <strong style={{ display: "flex", gap: 8, alignItems: "center", color: "#b45309" }}>
                <AlertTriangle size={18} /> Alertas
              </strong>
              <div className="stack mt-1">
                {k.lowStock.length > 0 && (
                  <Link to="/inventory" className="flex-between">
                    <span>Stock baixo</span>
                    <span className="badge badge-orange">{k.lowStock.length}</span>
                  </Link>
                )}
                {k.overduePayables > 0 && (
                  <Link to="/payables" className="flex-between">
                    <span>Contas a pagar vencidas</span>
                    <span className="badge badge-red">{k.overduePayables}</span>
                  </Link>
                )}
                {k.overdueReceivables > 0 && (
                  <Link to="/receivables" className="flex-between">
                    <span>Contas a receber vencidas</span>
                    <span className="badge badge-red">{k.overdueReceivables}</span>
                  </Link>
                )}
                {k.dueSoon > 0 && (
                  <div className="flex-between">
                    <span>Vencimentos (7 dias)</span>
                    <span className="badge badge-blue">{k.dueSoon}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {k.lowStock.length > 0 && (
            <div className="card mt-2">
              <div className="flex-between mb-1">
                <strong>Produtos em stock baixo</strong>
                <Link to="/inventory" className="btn btn-ghost btn-sm">
                  Ver
                </Link>
              </div>
              <div className="list">
                {k.lowStock.slice(0, 5).map((p) => (
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

          <div className="stats-grid mt-2">
            <Link to="/payables" className="stat">
              <label>
                <Banknote size={14} /> A pagar (vencidas)
              </label>
              <strong style={{ fontSize: "1.2rem" }}>{k.overduePayables}</strong>
            </Link>
            <Link to="/receivables" className="stat">
              <label>A receber (vencidas)</label>
              <strong style={{ fontSize: "1.2rem" }}>{k.overdueReceivables}</strong>
            </Link>
            <div className="stat">
              <label>Utilizadores ativos</label>
              <strong style={{ fontSize: "1.2rem" }}>{k.activeUsers}</strong>
            </div>
            <Link to="/reports" className="stat">
              <label>
                <FileText size={14} /> Relatórios
              </label>
              <strong style={{ fontSize: "1rem" }}>Abrir</strong>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
