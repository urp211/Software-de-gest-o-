import { useEffect, useState } from "react";
import {
  getSaleFull,
  listPendingSecondCopies,
  resolveSecondCopy,
  type SecondCopyRequest,
} from "../lib/db";
import { useAuth } from "../hooks/useAuth";
import { AdminOnly } from "../components/AdminOnly";
import { formatDate } from "../lib/format";
import { InvoicePreview } from "../components/InvoicePreview";

function Body() {
  const { user } = useAuth();
  const [items, setItems] = useState<SecondCopyRequest[]>([]);
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof getSaleFull>> | null>(
    null
  );

  const load = () => listPendingSecondCopies().then(setItems);
  useEffect(() => {
    load();
  }, []);

  const act = async (id: number, approve: boolean) => {
    if (!user) return;
    const saleId = await resolveSecondCopy(
      id,
      { id: user.id, name: user.name, role: user.role },
      approve
    );
    setMsg(approve ? "2ª via aprovada." : "Pedido rejeitado.");
    await load();
    if (approve) {
      const full = await getSaleFull(saleId);
      if (full) setPreview(full);
    }
  };

  return (
    <div>
      <h1 className="page-title">Autorizações</h1>
      <p className="page-sub">Pedidos de 2ª via de fatura pelos operadores.</p>
      {msg && <div className="alert alert-ok">{msg}</div>}

      {items.length === 0 ? (
        <div className="card empty">Sem pedidos pendentes.</div>
      ) : (
        <div className="list">
          {items.map((r) => (
            <div key={r.id} className="list-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
              <div className="flex-between">
                <div>
                  <h3 style={{ margin: 0 }}>{r.invoiceNumber}</h3>
                  <p className="text-muted" style={{ margin: "4px 0 0" }}>
                    {r.requestedByName} · {formatDate(r.createdAt)}
                  </p>
                  {r.reason && <p style={{ margin: "4px 0 0" }}>{r.reason}</p>}
                </div>
                <span className="badge badge-orange">PENDENTE</span>
              </div>
              <div className="fab-row mt-1">
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={() => act(r.id!, true)}
                >
                  Aprovar + imprimir
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => act(r.id!, false)}
                >
                  Rejeitar
                </button>
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
          copyLabel="2ª VIA"
        />
      )}
    </div>
  );
}

export default function ApprovalsPage() {
  return (
    <AdminOnly>
      <Body />
    </AdminOnly>
  );
}
