import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import {
  getDashboardStats,
  getSettings,
  listSales,
  moneyShort,
  type Sale,
} from "../lib/db";
import { buildA4StatementHtml, printHtml } from "../lib/print";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../lib/format";

export default function ReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [stats, setStats] = useState({
    salesCount: 0,
    revenue: 0,
    profit: 0,
    stockValue: 0,
    totalUnits: 0,
    todayRevenue: 0,
  });
  const [recent, setRecent] = useState<Sale[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const s = await getDashboardStats({ role: user.role, userId: user.id });
      setStats({
        salesCount: s.salesCount,
        revenue: s.revenue,
        profit: s.profit,
        stockValue: s.stockValue,
        totalUnits: s.totalUnits,
        todayRevenue: s.todayRevenue,
      });
      setRecent(
        (await listSales({ role: user.role, userId: user.id }))
          .filter((x) => x.status === "COMPLETED")
          .slice(0, 30)
      );
    })();
  }, [user]);

  const printA4 = async () => {
    const settings = await getSettings();
    const rows = recent.map((s) => ({
      col1: s.invoiceNumber,
      col2: formatDate(s.createdAt),
      col3: moneyShort(s.totalAmount),
      col4: isAdmin ? moneyShort(s.profit) : undefined,
    }));
    const html = buildA4StatementHtml({
      title: isAdmin ? "Extrato de Vendas A4" : "Extrato das minhas vendas",
      settings,
      rows: rows.map((r) => ({
        col1: r.col1,
        col2: r.col2,
        col3: r.col3,
        col4: r.col4,
      })),
      summary: [
        { label: "Vendas", value: String(stats.salesCount) },
        { label: "Receita", value: moneyShort(stats.revenue) },
        ...(isAdmin
          ? [
              { label: "Lucro", value: moneyShort(stats.profit) },
              { label: "Stock", value: moneyShort(stats.stockValue) },
            ]
          : [{ label: "Hoje", value: moneyShort(stats.todayRevenue) }]),
      ],
    });
    printHtml(html);
  };

  return (
    <div>
      <div className="flex-between mb-1" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Extratos / Relatórios</h1>
          <p className="page-sub">
            {isAdmin
              ? "Resumo financeiro e stock."
              : "Resumo das suas vendas (sem lucros)."}
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={printA4}>
          <FileText size={16} /> A4
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat">
          <label>Vendas</label>
          <strong>{stats.salesCount}</strong>
        </div>
        <div className="stat emerald">
          <label>Receita</label>
          <strong>{moneyShort(stats.revenue)}</strong>
        </div>
        {isAdmin ? (
          <>
            <div className="stat purple">
              <label>Lucro</label>
              <strong>{moneyShort(stats.profit)}</strong>
            </div>
            <div className="stat amber">
              <label>Valor stock</label>
              <strong>{moneyShort(stats.stockValue)}</strong>
              <div className="text-muted" style={{ fontSize: "0.78rem", marginTop: 4 }}>
                {stats.totalUnits} un.
              </div>
            </div>
          </>
        ) : (
          <div className="stat amber">
            <label>Receita hoje</label>
            <strong>{moneyShort(stats.todayRevenue)}</strong>
          </div>
        )}
      </div>

      <div className="card mt-2">
        <h3 style={{ marginTop: 0 }}>Últimas vendas</h3>
        {recent.length === 0 ? (
          <div className="empty">Sem dados.</div>
        ) : (
          <div className="list">
            {recent.map((s) => (
              <div key={s.id} className="list-item">
                <div className="meta">
                  <h3 style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.85rem" }}>
                    {s.invoiceNumber}
                  </h3>
                  <p>{formatDate(s.createdAt)}</p>
                </div>
                <div className="text-right">
                  <div className="fw-bold">{moneyShort(s.totalAmount)}</div>
                  {isAdmin && (
                    <div className="profit" style={{ fontSize: "0.8rem" }}>
                      {moneyShort(s.profit)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
