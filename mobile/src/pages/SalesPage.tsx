import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, FileText, Printer, ShoppingCart, Ban } from "lucide-react";
import {
  cancelSale,
  getSaleFull,
  listSales,
  moneyShort,
  requestSecondCopy,
  type Sale,
  PAYMENT_LABELS,
} from "../lib/db";
import { formatDate } from "../lib/format";
import { useAuth } from "../hooks/useAuth";
import { InvoicePreview } from "../components/InvoicePreview";

export default function SalesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof getSaleFull>> | null>(
    null
  );
  const [copyLabel, setCopyLabel] = useState("ORIGINAL");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setSales(await listSales({ role: user.role, userId: user.id }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openInvoice = async (id: number, label = "ORIGINAL") => {
    const full = await getSaleFull(id);
    if (!full) return;
    setCopyLabel(label);
    setPreview(full);
  };

  const onSecondCopy = async (sale: Sale) => {
    if (!user || !sale.id) return;
    setError("");
    setMsg("");
    try {
      const res = await requestSecondCopy(sale.id, {
        id: user.id,
        name: user.name,
        role: user.role,
      });
      if (res.approved) {
        setMsg(`2ª via autorizada: ${sale.invoiceNumber}`);
        await openInvoice(sale.id, "2ª VIA");
      } else {
        setMsg("Pedido de 2ª via enviado ao administrador.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    }
  };

  const onCancel = async (sale: Sale) => {
    if (!user || !sale.id || !isAdmin) return;
    const reason = prompt("Motivo da anulação (obrigatório):");
    if (!reason?.trim()) return;
    if (!confirm(`Anular ${sale.invoiceNumber}? O stock será reposto.`)) return;
    try {
      await cancelSale(sale.id, { id: user.id, name: user.name, role: user.role }, reason);
      setMsg(`Fatura ${sale.invoiceNumber} anulada.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao anular");
    }
  };

  return (
    <div>
      <h1 className="page-title">Faturação e Vendas</h1>
      <p className="page-sub">
        {isAdmin
          ? "Todas as vendas · anulação e 2ª via."
          : "Apenas as suas vendas · 2ª via mediante autorização."}
      </p>

      <div className="toolbar">
        <div />
        <Link to="/sales/new" className="btn btn-success">
          <ShoppingCart size={18} /> Nova Venda (POS)
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-ok">{msg}</div>}

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
                <p>
                  {formatDate(s.createdAt)}
                  {s.operatorName ? ` · ${s.operatorName}` : ""}
                </p>
                <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span
                    className={`badge ${
                      s.status === "COMPLETED" ? "badge-green" : "badge-red"
                    }`}
                  >
                    {s.status === "COMPLETED" ? "Concluída" : "Anulada"}
                  </span>
                  <span className="badge badge-blue">
                    {PAYMENT_LABELS[s.paymentMethod || "CASH"]}
                  </span>
                  {(s.reprintCount || 0) > 0 && (
                    <span className="badge badge-orange">
                      Reimpressões: {s.reprintCount}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="price">{moneyShort(s.totalAmount)}</div>
                {isAdmin && (
                  <div className="profit" style={{ fontSize: "0.8rem" }}>
                    Lucro {moneyShort(s.profit)}
                  </div>
                )}
                <div className="fab-row" style={{ justifyContent: "flex-end", marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    title="Pré-visualizar / imprimir"
                    onClick={() => openInvoice(s.id!)}
                    disabled={s.status !== "COMPLETED"}
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    title="2ª via"
                    onClick={() => onSecondCopy(s)}
                    disabled={s.status !== "COMPLETED"}
                  >
                    <Copy size={16} />
                  </button>
                  {isAdmin && s.status === "COMPLETED" && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      title="Anular"
                      onClick={() => onCancel(s)}
                    >
                      <Ban size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <InvoicePreview
          open={!!preview}
          onClose={() => setPreview(null)}
          sale={preview.sale}
          items={preview.items}
          settings={preview.settings}
          copyLabel={copyLabel}
        />
      )}
    </div>
  );
}
