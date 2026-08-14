import { FormEvent, useEffect, useState } from "react";
import { PackagePlus, ShoppingBag } from "lucide-react";
import {
  createPurchase,
  listPurchases,
  listSuppliers,
  receivePurchase,
  type Purchase,
  type Supplier,
} from "../lib/enterprise";
import { listParts, moneyShort } from "../lib/db";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../lib/format";

export default function PurchasesPage() {
  const { user, can } = useAuth();
  const [rows, setRows] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [parts, setParts] = useState<Awaited<ReturnType<typeof listParts>>>([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [partId, setPartId] = useState("");
  const [qty, setQty] = useState("1");
  const [cost, setCost] = useState("");
  const [receiveNow, setReceiveNow] = useState(true);
  const [cart, setCart] = useState<
    { partId: number | null; name: string; quantity: number; unitCost: number }[]
  >([]);

  const load = async () => {
    setRows(await listPurchases());
    setSuppliers(await listSuppliers());
    setParts(await listParts());
  };
  useEffect(() => {
    load();
  }, []);

  const addLine = () => {
    const p = parts.find((x) => String(x.id) === partId);
    if (!p && !cost) return;
    setCart((c) => [
      ...c,
      {
        partId: p?.id ?? null,
        name: p?.name || "Item",
        quantity: Math.max(1, parseInt(qty, 10) || 1),
        unitCost: parseFloat(cost) || Number(p?.cost) || 0,
      },
    ]);
    setPartId("");
    setQty("1");
    setCost("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !cart.length) return;
    setError("");
    try {
      const sup = suppliers.find((s) => String(s.id) === supplierId);
      const res = await createPurchase(
        {
          supplierId: supplierId ? parseInt(supplierId, 10) : null,
          supplierName: sup?.name || null,
          items: cart,
          receiveNow,
        },
        { id: user.id, name: user.name, role: user.role }
      );
      setMsg(`Compra ${res.number} · ${moneyShort(res.total)}`);
      setCart([]);
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  };

  const onReceive = async (id: number) => {
    if (!user) return;
    try {
      await receivePurchase(id, { id: user.id, name: user.name, role: user.role });
      setMsg("Compra recebida e stock atualizado.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  };

  return (
    <div>
      <h1 className="page-title">Compras</h1>
      <p className="page-sub">Pedidos a fornecedores e receção de stock.</p>
      {msg && <div className="alert alert-ok">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <div />
        {can("purchases.create") && (
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <PackagePlus size={16} /> Nova compra
          </button>
        )}
      </div>

      <div className="list">
        {rows.length === 0 ? (
          <div className="card empty">Sem compras.</div>
        ) : (
          rows.map((p) => (
            <div key={p.id} className="list-item">
              <div className="meta">
                <h3 style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.9rem" }}>
                  {p.number}
                </h3>
                <p>
                  {p.supplierName || "—"} · {formatDate(p.createdAt)}
                </p>
                <span
                  className={`badge ${
                    p.status === "RECEIVED"
                      ? "badge-green"
                      : p.status === "CANCELLED"
                        ? "badge-red"
                        : "badge-blue"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <div className="text-right">
                <div className="price">{moneyShort(p.totalAmount)}</div>
                {p.status !== "RECEIVED" && can("purchases.receive") && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm mt-1"
                    onClick={() => onReceive(p.id!)}
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
          <div className="sheet" style={{ maxHeight: "90dvh" }}>
            <div className="sheet-handle" />
            <strong style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <ShoppingBag size={18} /> Nova compra
            </strong>
            <form onSubmit={onSubmit} className="mt-1">
              <div className="field">
                <label>Fornecedor</label>
                <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">—</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="row-2">
                <div className="field">
                  <label>Produto</label>
                  <select
                    value={partId}
                    onChange={(e) => {
                      setPartId(e.target.value);
                      const p = parts.find((x) => String(x.id) === e.target.value);
                      if (p) setCost(String(p.cost));
                    }}
                  >
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
                  <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" min={1} />
                </div>
              </div>
              <div className="field">
                <label>Custo unit. (Kz)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addLine}>
                + Adicionar linha
              </button>
              <div className="list mt-1">
                {cart.map((c, i) => (
                  <div key={i} className="list-item">
                    <div className="meta">
                      <h3>{c.name}</h3>
                      <p>
                        {c.quantity} × {moneyShort(c.unitCost)}
                      </p>
                    </div>
                    <strong>{moneyShort(c.quantity * c.unitCost)}</strong>
                  </div>
                ))}
              </div>
              <label className="flex-between mt-1" style={{ marginBottom: 12 }}>
                <span>Receber agora (atualiza stock)</span>
                <input
                  type="checkbox"
                  checked={receiveNow}
                  onChange={(e) => setReceiveNow(e.target.checked)}
                />
              </label>
              <button className="btn btn-primary btn-block" type="submit" disabled={!cart.length}>
                Guardar compra
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
