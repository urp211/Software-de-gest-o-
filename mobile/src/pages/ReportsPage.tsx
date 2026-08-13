import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { getDashboardStats, listSales, moneyShort, type Sale } from "../lib/db";
import { formatDate } from "../lib/format";

export default function ReportsPage() {
  const [stats, setStats] = useState({
    salesCount: 0,
    revenue: 0,
    profit: 0,
    stockValue: 0,
    totalUnits: 0,
  });
  const [recent, setRecent] = useState<Sale[]>([]);

  useEffect(() => {
    (async () => {
      const s = await getDashboardStats();
      setStats({
        salesCount: s.salesCount,
        revenue: s.revenue,
        profit: s.profit,
        stockValue: s.stockValue,
        totalUnits: s.totalUnits,
      });
      setRecent((await listSales()).slice(0, 20));
    })();
  }, []);

  return (
    <div>
      <div className="flex-between mb-1" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Extratos / Relatórios</h1>
          <p className="page-sub">Resumo financeiro e de stock (offline).</p>
        </div>
        <div
          style={{
            background: "#e0e7ff",
            color: "#4338ca",
            borderRadius: 12,
            padding: 10,
          }}
        >
          <FileText size={22} />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat">
          <label>Vendas concluídas</label>
          <strong>{stats.salesCount}</strong>
        </div>
        <div className="stat emerald">
          <label>Receita total</label>
          <strong>{moneyShort(stats.revenue)}</strong>
        </div>
        <div className="stat purple">
          <label>Lucro total</label>
          <strong>{moneyShort(stats.profit)}</strong>
        </div>
        <div className="stat amber">
          <label>Valor em stock</label>
          <strong>{moneyShort(stats.stockValue)}</strong>
          <div className="text-muted" style={{ fontSize: "0.78rem", marginTop: 4 }}>
            {stats.totalUnits} unidades
          </div>
        </div>
      </div>

      <div className="card mt-2">
        <h3 style={{ marginTop: 0 }}>Últimas 20 vendas</h3>
        {recent.length === 0 ? (
          <div className="empty">Sem dados para relatório.</div>
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
                  <div className="profit" style={{ fontSize: "0.8rem" }}>
                    {moneyShort(s.profit)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
