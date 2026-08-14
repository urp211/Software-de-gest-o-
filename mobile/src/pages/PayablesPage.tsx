import { FormEvent, useEffect, useState } from "react";
import {
  addPayable,
  listPayables,
  listSuppliers,
  payPayable,
  type AccountPayable,
  type Supplier,
} from "../lib/enterprise";
import { moneyShort } from "../lib/db";
import { useAuth } from "../hooks/useAuth";
import { formatDateShort } from "../lib/format";

export default function PayablesPage() {
  const { user, can } = useAuth();
  const [rows, setRows] = useState<AccountPayable[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    supplierId: "",
    description: "",
    amount: "",
    dueDays: "7",
    category: "OTHER",
  });

  const load = async () => {
    setRows(await listPayables());
    setSuppliers(await listSuppliers());
  };
  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    try {
      const sup = suppliers.find((s) => String(s.id) === form.supplierId);
      await addPayable(
        {
          supplierId: form.supplierId ? parseInt(form.supplierId, 10) : null,
          supplierName: sup?.name || null,
          description: form.description,
          amount: parseFloat(form.amount),
          dueDate: Date.now() + parseInt(form.dueDays || "7", 10) * 86400000,
          category: form.category,
        },
        { id: user.id, name: user.name, role: user.role }
      );
      setOpen(false);
      setForm({
        supplierId: "",
        description: "",
        amount: "",
        dueDays: "7",
        category: "OTHER",
      });
      setMsg("Conta a pagar registada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  };

  const onPay = async (id: number, total: number, paid: number) => {
    if (!user) return;
    const rest = Math.max(0, total - paid);
    const raw = prompt(`Valor a pagar (saldo ${rest}):`, String(rest));
    if (raw == null) return;
    const amount = parseFloat(raw);
    if (!Number.isFinite(amount) || amount <= 0) return;
    try {
      await payPayable(id, amount, { id: user.id, name: user.name, role: user.role });
      setMsg("Pagamento registado.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  };

  const totalOpen = rows
    .filter((r) => r.status !== "PAID" && r.status !== "CANCELLED")
    .reduce((a, r) => a + (r.amount - r.paidAmount), 0);

  return (
    <div>
      <h1 className="page-title">Contas a pagar</h1>
      <p className="page-sub">Obrigações, vencimentos e pagamentos parciais.</p>
      {msg && <div className="alert alert-ok">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stat amber mb-2">
        <label>Em aberto</label>
        <strong>{moneyShort(totalOpen)}</strong>
      </div>

      <div className="toolbar">
        <div />
        {can("finance.create") && (
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            Nova obrigação
          </button>
        )}
      </div>

      <div className="list">
        {rows.length === 0 ? (
          <div className="card empty">Sem contas a pagar.</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="list-item">
              <div className="meta">
                <h3>{r.description}</h3>
                <p>
                  {r.number} · {r.supplierName || "—"} · Venc.{" "}
                  {formatDateShort(r.dueDate)}
                </p>
                <span
                  className={`badge ${
                    r.status === "PAID"
                      ? "badge-green"
                      : r.status === "OVERDUE"
                        ? "badge-red"
                        : r.status === "PARTIAL"
                          ? "badge-orange"
                          : "badge-blue"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <div className="text-right">
                <div className="price">{moneyShort(r.amount)}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                  Pago {moneyShort(r.paidAmount)}
                </div>
                {r.status !== "PAID" && can("finance.pay") && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm mt-1"
                    onClick={() => onPay(r.id!, r.amount, r.paidAmount)}
                  >
                    Pagar
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
            <strong>Nova conta a pagar</strong>
            <form onSubmit={onSubmit} className="mt-1">
              <div className="field">
                <label>Fornecedor</label>
                <select
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                >
                  <option value="">—</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
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
