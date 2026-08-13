import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, FileText } from "lucide-react";
import { listSales, moneyShort, type Sale } from "../lib/db";
import { formatDate } from "../lib/format";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSales()
      .then(setSales)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="page-title">Faturação e Vendas</h1>
      <p className="page-sub">Gestão de vendas e faturas (padrão AGT) — offline.</p>

      <div className="toolbar">
        <div />
        <Link to="/sales/new" className="btn btn-success">
          <ShoppingCart size={18} /> Nova Venda (POS)
        </Link>
      </div>

      {loading ? (
        <div className="empty">A carregar…</div>
      ) : sales.length === 0 ? (
        <div className="card empty">Nenhuma venda registada.</div>
      ) : (
        <div className="list">
          {sales.map((s) => (
            <div key={s.id} className="list-item">
              <div className="meta">
                <h3 style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.9rem" }}>
                  {s.invoiceNumber}
                </h3>
                <p>{formatDate(s.createdAt)}</p>
                <div style={{ marginTop: 8 }}>
                  <span
                    className={`badge ${
                      s.status === "COMPLETED" ? "badge-green" : "badge-red"
                    }`}
                  >
                    {s.status === "COMPLETED" ? "Concluída" : "Cancelada"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="price">{moneyShort(s.totalAmount)}</div>
                <div className="profit" style={{ fontSize: "0.8rem" }}>
                  Lucro {moneyShort(s.profit)}
                </div>
                <FileText size={18} color="#2563eb" style={{ marginLeft: "auto", marginTop: 8 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
