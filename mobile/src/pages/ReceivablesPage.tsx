import { FormEvent, useEffect, useState } from "react";
import {
  addReceivable,
  listReceivables,
  receiveReceivable,
  type AccountReceivable,
} from "../lib/enterprise";
import { listClients, moneyShort } from "../lib/db";
import { useAuth } from "../hooks/useAuth";
import { formatDateShort } from "../lib/format";

export default function ReceivablesPage() {
  const { user, can } = useAuth();
  const [rows, setRows] = useState<AccountReceivable[]>([]);
  const [clients, setClients] = useState<Awaited<ReturnType<typeof listClients>>>([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    clientId: "",
    description: "",
    amount: "",
    dueDays: "7",
  });

  const load = async () => {
    setRows(await listReceivables());
    setClients(await listClients());
  };
  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    try {
      const c = clients.find((x) => String(x.id) === form.clientId);
      await addReceivable(
        {
          clientId: form.clientId ? parseInt(form.clientId, 10) : null,
          clientName: c?.name || null,
          description: form.description,
          amount: parseFloat(form.amount),
          dueDate: Date.now() + parseInt(form.dueDays || "7", 10) * 86400000,
        },
        { id: user.id, name: user.name, role: user.role }
      );
      setOpen(false);
      setMsg("Conta a receber registada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  };

  const onReceive = async (id: number, total: number, rec: number) => {
    if (!user) return;
    const rest = Math.max(0, total - rec);
    const raw = prompt(`Valor a receber (saldo ${rest}):`, String(rest));
    if (raw == null) return;
    const amount = parseFloat(raw);
    if (!Number.isFinite(amount) || amount <= 0) return;
    try {
      await receiveReceivable(id, amount, {
        id: user.id,
        name: user.name,
        role: user.role,
      });
      setMsg("Recebimento registado.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  };

  const totalOpen = rows
    .filter((r) => r.status !== "PAID" && r.status !== "CANCELLED")
    .reduce((a, r) => a + (r.amount - r.receivedAmount), 0);

  return (
    <div>
      <h1 className="page-title">Contas a receber</h1>
      <p className="page-sub">Créditos de clientes, vencimentos e cobranças.</p>
      {msg && <div className="alert alert-ok">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stat emerald mb-2">
        <label>Em aberto</label>
        <strong>{moneyShort(totalOpen)}</strong>
      </div>

      <div className="toolbar">
        <div />
        {can("finance.create") && (
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            Novo crédito
          </button>
        )}
      </div>

      <div className="list">
        {rows.length === 0 ? (
          <div className="card empty">Sem contas a receber.</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="list-item">
              <div className="meta">
                <h3>{r.description}</h3>
                <p>
                  {r.number} · {r.clientName || "—"} · Venc.{" "}
                  {formatDateShort(r.dueDate)}
                </p>
                <span
                  className={`badge ${
                    r.status === "PAID"
                      ? "badge-green"
                      : r.status === "OVERDUE"
                        ? "badge-red"
                        : "badge-blue"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <div className="text-right">
                <div className="price">{moneyShort(r.amount)}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                  Recebido {moneyShort(r.receivedAmount)}
                </div>
                {r.status !== "PAID" && can("finance.pay") && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm mt-1"
                    onClick={() => onReceive(r.id!, r.amount, r.receivedAmount)}
                  >
                    Receber
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
            <strong>Nova conta a receber</strong>
            <form onSubmit={onSubmit} className="mt-1">
              <div className="field">
                <label>Cliente</label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                >
                  <option value="">—</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Descrição</label>
                <input
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="row-2">
                <div className="field">
                  <label>Valor (Kz)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Vence em (dias)</label>
                  <input
                    type="number"
                    value={form.dueDays}
                    onChange={(e) => setForm({ ...form, dueDays: e.target.value })}
                  />
                </div>
              </div>
              <button className="btn btn-primary btn-block" type="submit">
                Guardar
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
