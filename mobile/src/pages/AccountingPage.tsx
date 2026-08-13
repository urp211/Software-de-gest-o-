import { useEffect, useMemo, useState } from "react";
import { FileText, TrendingUp } from "lucide-react";
import {
  getAccountingStats,
  getSettings,
  listSales,
  moneyShort,
  type Sale,
} from "../lib/db";
import { buildA4StatementHtml, printHtml } from "../lib/print";
import { useAuth } from "../hooks/useAuth";
import { formatDateShort } from "../lib/format";

export default function AccountingPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [range, setRange] = useState<"7" | "30" | "90" | "all">("30");
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAccountingStats>> | null>(
    null
  );
  const [mySales, setMySales] = useState<Sale[]>([]);

  const { from, to } = useMemo(() => {
    const to = Date.now();
    if (range === "all") return { from: 0, to };
    const days = parseInt(range, 10);
    return { from: to - days * 86400000, to };
  }, [range]);

  useEffect(() => {
    if (!user) return;
    if (isAdmin) {
      getAccountingStats(from, to).then(setStats);
    } else {
      listSales({ role: "OPERATOR", userId: user.id }).then((s) => {
        const filtered = s.filter(
          (x) => x.status === "COMPLETED" && x.createdAt >= from && x.createdAt <= to
        );
        setMySales(filtered);
      });
    }
  }, [user, isAdmin, from, to]);

  const printA4 = async () => {
    const settings = await getSettings();
    if (isAdmin && stats) {
      const rows = stats.daily.map((d) => ({
        col1: d.date,
        col2: `${d.count} vendas`,
        col3: moneyShort(d.revenue),
        col4: moneyShort(d.profit),
      }));
      const html = buildA4StatementHtml({
        title: "Extrato Contabilístico A4",
        subtitle: `Período: últimos ${range === "all" ? "todos" : range + " dias"}`,
        settings,
        rows,
        summary: [
          { label: "Receita", value: moneyShort(stats.revenue) },
          { label: "CMV / Custo", value: moneyShort(stats.cogs) },
          { label: "Lucro bruto", value: moneyShort(stats.grossProfit) },
          { label: "Despesas", value: moneyShort(stats.expenseTotal) },
          { label: "Lucro líquido", value: moneyShort(stats.netProfit) },
          { label: "Margem", value: `${stats.margin.toFixed(1)}%` },
          { label: "IVA cobrado", value: moneyShort(stats.taxCollected) },
        ],
      });
      printHtml(html);
    } else {
      const rev = mySales.reduce((a, s) => a + s.totalAmount, 0);
      const rows = mySales.map((s) => ({
        col1: s.invoiceNumber,
        col2: formatDateShort(s.createdAt),
        col3: moneyShort(s.totalAmount),
      }));
      const html = buildA4StatementHtml({
        title: "Extrato do Operador",
        subtitle: user?.name || "",
        settings,
        rows,
        summary: [
          { label: "Vendas", value: String(mySales.length) },
          { label: "Receita", value: moneyShort(rev) },
        ],
      });
      printHtml(html);
    }
  };

  if (!isAdmin) {
    const rev = mySales.reduce((a, s) => a + s.totalAmount, 0);
    return (
      <div>
        <h1 className="page-title">O meu desempenho</h1>
        <p className="page-sub">Estatísticas das suas vendas (sem lucros da empresa).</p>
        <div className="toolbar">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as typeof range)}
            style={{ minHeight: 48, borderRadius: 12, border: "1px solid #cbd5e1", padding: "0 12px" }}
          >
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
            <option value="all">Tudo</option>
          </select>
          <button type="button" className="btn btn-primary" onClick={printA4}>
            <FileText size={16} /> Extrato A4
          </button>
        </div>
        <div className="stats-grid">
          <div className="stat emerald">
            <label>Receita (suas vendas)</label>
            <strong>{moneyShort(rev)}</strong>
          </div>
          <div className="stat">
            <label>Nº de vendas</label>
            <strong>{mySales.length}</strong>
          </div>
          <div className="stat">
            <label>Ticket médio</label>
            <strong>
              {moneyShort(mySales.length ? rev / mySales.length : 0)}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return <div className="empty">A carregar contabilidade…</div>;

  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.revenue));

  return (
    <div>
      <div className="flex-between" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Contabilidade & Estatística</h1>
          <p className="page-sub">Análise avançada offline (AGT / gestão).</p>
        </div>
        <TrendingUp />
      </div>

      <div className="toolbar">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as typeof range)}
          style={{ minHeight: 48, borderRadius: 12, border: "1px solid #cbd5e1", padding: "0 12px" }}
        >
          <option value="7">7 dias</option>
          <option value="30">30 dias</option>
          <option value="90">90 dias</option>
          <option value="all">Tudo</option>
        </select>
        <button type="button" className="btn btn-primary" onClick={printA4}>
          <FileText size={16} /> Imprimir extrato A4
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat emerald">
          <label>Receita</label>
          <strong style={{ fontSize: "1.35rem" }}>{moneyShort(stats.revenue)}</strong>
        </div>
        <div className="stat">
          <label>CMV (custo)</label>
          <strong style={{ fontSize: "1.35rem" }}>{moneyShort(stats.cogs)}</strong>
        </div>
        <div className="stat purple">
          <label>Lucro bruto</label>
          <strong style={{ fontSize: "1.35rem" }}>{moneyShort(stats.grossProfit)}</strong>
        </div>
        <div className="stat amber">
          <label>Despesas</label>
          <strong style={{ fontSize: "1.35rem" }}>{moneyShort(stats.expenseTotal)}</strong>
        </div>
        <div className="stat emerald">
          <label>Lucro líquido</label>
          <strong style={{ fontSize: "1.35rem" }}>{moneyShort(stats.netProfit)}</strong>
        </div>
        <div className="stat">
          <label>Margem</label>
          <strong style={{ fontSize: "1.35rem" }}>{stats.margin.toFixed(1)}%</strong>
        </div>
        <div className="stat">
          <label>Ticket médio</label>
          <strong style={{ fontSize: "1.35rem" }}>{moneyShort(stats.avgTicket)}</strong>
        </div>
        <div className="stat">
          <label>IVA cobrado</label>
          <strong style={{ fontSize: "1.35rem" }}>{moneyShort(stats.taxCollected)}</strong>
        </div>
      </div>

      <div className="card mt-2">
        <h3 style={{ marginTop: 0 }}>Receita diária</h3>
        {stats.daily.length === 0 ? (
          <div className="empty">Sem dados no período.</div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, overflowX: "auto" }}>
            {stats.daily.slice(-30).map((d) => (
              <div key={d.date} title={`${d.date}: ${moneyShort(d.revenue)}`} style={{ flex: "0 0 14px" }}>
                <div
                  style={{
                    height: `${Math.max(4, (d.revenue / maxDaily) * 100)}%`,
                    background: "linear-gradient(180deg,#2563eb,#7c3aed)",
                    borderRadius: 4,
                    minHeight: 4,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card mt-2">
        <h3 style={{ marginTop: 0 }}>Por operador</h3>
        <div className="list">
          {stats.byOperator.map((op) => (
            <div key={op.name} className="list-item">
              <div className="meta">
                <h3>{op.name}</h3>
                <p>{op.sales} vendas</p>
              </div>
              <div className="text-right">
                <div className="price">{moneyShort(op.revenue)}</div>
                <div className="profit" style={{ fontSize: "0.8rem" }}>
                  Lucro {moneyShort(op.profit)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-2">
        <h3 style={{ marginTop: 0 }}>Top produtos</h3>
        <div className="list">
          {stats.topProducts.map((p) => (
            <div key={p.name} className="list-item">
              <div className="meta">
                <h3>{p.name}</h3>
                <p>{p.qty} un.</p>
              </div>
              <div className="price">{moneyShort(p.revenue)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-2">
        <h3 style={{ marginTop: 0 }}>Pagamentos</h3>
        <div className="stack">
          {Object.entries(stats.byPayment).map(([k, v]) => (
            <div key={k} className="flex-between">
              <span>{k}</span>
              <strong>{moneyShort(v)}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-grid mt-2">
        <div className="stat">
          <label>Stock a preço venda</label>
          <strong style={{ fontSize: "1.1rem" }}>{moneyShort(stats.stockValue)}</strong>
        </div>
        <div className="stat">
          <label>Stock a custo</label>
          <strong style={{ fontSize: "1.1rem" }}>{moneyShort(stats.stockCost)}</strong>
        </div>
      </div>
    </div>
  );
}
