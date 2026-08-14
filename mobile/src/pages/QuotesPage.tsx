import { FormEvent, useEffect, useState } from "react";
import {
  createQuote,
  listQuotes,
  setQuoteStatus,
  type Quote,
} from "../lib/enterprise";
import { listClients, listParts, moneyShort } from "../lib/db";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../lib/format";

export default function QuotesPage() {
  const { user, can } = useAuth();
  const [rows, setRows] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Awaited<ReturnType<typeof listClients>>>([]);
  const [parts, setParts] = useState<Awaited<ReturnType<typeof listParts>>>([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [clientId, setClientId] = useState("");
  const [partId, setPartId] = useState("");
  const [qty, setQty] = useState("1");
  const [cart, setCart] = useState<
    { partId: number | null; name: string; quantity: number; unitPrice: number }[]
  >([]);

  const load = async () => {
    setRows(await listQuotes());
    setClients(await listClients());
    setParts(await listParts());
  };
  useEffect(() => {
    load();
  }, []);

  const addLine = () => {
    const p = parts.find((x) => String(x.id) === partId);
    if (!p) return;
    setCart((c) => [
      ...c,
      {
        partId: p.id!,
        name: p.name,
        quantity: Math.max(1, parseInt(qty, 10) || 1),
        unitPrice: Number(p.price),
      },
    ]);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !cart.length) return;
    try {
      const c = clients.find((x) => String(x.id) === clientId);
      const res = await createQuote(
        {
          clientId: clientId ? parseInt(clientId, 10) : null,
          clientName: c?.name || null,
          items: cart,
        },
        { id: user.id, name: user.name, role: user.role }
      );
      setMsg(`Orçamento ${res.number}`);
      setCart([]);
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  };

  return (
    <div>
      <h1 className="page-title">Orçamentos</h1>
      <p className="page-sub">Propostas a clientes · conversão em venda.</p>
      {msg && <div className="alert alert-ok">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <div />
        {can("quotes.create") && (
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            Novo orçamento
          </button>
        )}
      </div>

      <div className="list">
        {rows.length === 0 ? (
          <div className="card empty">Sem orçamentos.</div>
        ) : (
          rows.map((q) => (
            <div key={q.id} className="list-item">
              <div className="meta">
                <h3 style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.9rem" }}>
                  {q.number}
                </h3>
                <p>
                  {q.clientName || "—"} · {formatDate(q.createdAt)}
                </p>
                <span className="badge badge-blue">{q.status}</span>
              </div>
              <div className="text-right">
                <div className="price">{moneyShort(q.totalAmount)}</div>
                {q.status === "DRAFT" && user && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm mt-1"
                    onClick={async () => {
                      await setQuoteStatus(q.id!, "SENT", {
                        id: user.id,
                        name: user.name,
                        role: user.role,
                      });
                      await load();
                    }}
                  >
                    Marcar enviado
                  </button>
                )}
                {q.status === "SENT" && user && can("approvals.manage") && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm mt-1"
                    onClick={async () => {
                      await setQuoteStatus(q.id!, "APPROVED", {
                        id: user.id,
                        name: user.name,
                        role: user.role,
                      });
                      setMsg("Orçamento aprovado.");
                      await load();
                    }}
                  >
                    Aprovar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {open && (
        <>
          <div className="sheet-backdrop" onClick={() => setOpen(false)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <strong>Novo orçamento</strong>
            <form onSubmit={onSubmit} className="mt-1">
              <div className="field">
                <label>Cliente</label>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  <option value="">—</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="row-2">
                <div className="field">
                  <label>Produto</label>
                  <select value={partId} onChange={(e) => setPartId(e.target.value)}>
                    <option value="">—</option>
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Qtd</label>
                  <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addLine}>
                + Linha
              </button>
              <div className="list mt-1">
                {cart.map((c, i) => (
                  <div key={i} className="list-item">
                    <div className="meta">
                      <h3>{c.name}</h3>
                      <p>
                        {c.quantity} × {moneyShort(c.unitPrice)}
                      </p>
                    </div>
                    <strong>{moneyShort(c.quantity * c.unitPrice)}</strong>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary btn-block mt-1" type="submit" disabled={!cart.length}>
                Guardar orçamento
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
