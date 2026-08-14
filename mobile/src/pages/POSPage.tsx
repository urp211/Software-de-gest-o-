import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import {
  createSale,
  getSaleFull,
  getSettings,
  listClients,
  listParts,
  moneyShort,
  type Client,
  type PaymentMethod,
  type Sale,
  type SaleItem,
  type Settings,
  PAYMENT_LABELS,
} from "../lib/db";
import { useAuth } from "../hooks/useAuth";
import { InvoicePreview } from "../components/InvoicePreview";

type PartRow = Awaited<ReturnType<typeof listParts>>[number];
type CartItem = PartRow & { quantity: number };

export default function POSPage() {
  const { user } = useAuth();
  const [parts, setParts] = useState<PartRow[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientNif, setClientNif] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [discount, setDiscount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");

  const [preview, setPreview] = useState<{
    sale: Sale;
    items: SaleItem[];
    settings: Settings;
  } | null>(null);

  useEffect(() => {
    listParts().then(setParts);
    listClients().then(setClients);
    getSettings().then(setSettings);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = parts.filter((p) => p.stock > 0);
    if (!q) return base;
    return base.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.trackingCode.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }, [parts, search]);

  const subtotal = cart.reduce((a, i) => a + i.price * i.quantity, 0);
  const disc = Math.min(Number(discount) || 0, subtotal);
  const taxRate = settings?.taxRate || 0;
  const afterDisc = Math.max(0, subtotal - disc);
  const tax = (afterDisc * taxRate) / 100;
  const total = afterDisc + tax;
  const paid = amountPaid === "" ? total : Number(amountPaid) || 0;
  const change = Math.max(0, paid - total);

  useEffect(() => {
    // auto-fill amount paid with total when cart changes (cash convenience)
    if (paymentMethod === "CASH") {
      setAmountPaid(total > 0 ? String(Number(total.toFixed(2))) : "");
    } else if (paymentMethod !== "CASH" && total > 0) {
      // Non-cash: exact amount, no change expected
      setAmountPaid(String(Number(total.toFixed(2))));
    }
  }, [total, paymentMethod]);

  const addToCart = (part: PartRow) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === part.id);
      if (existing) {
        if (existing.quantity >= part.stock) return prev;
        return prev.map((i) =>
          i.id === part.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...part, quantity: 1 }];
    });
  };

  const changeQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id !== id) return i;
          const next = i.quantity + delta;
          if (next < 1) return { ...i, quantity: 0 };
          if (next > i.stock) return i;
          return { ...i, quantity: next };
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const remove = (id: number) => setCart((prev) => prev.filter((i) => i.id !== id));

  const onClientPick = (id: string) => {
    setClientId(id);
    const c = clients.find((x) => String(x.id) === id);
    if (c) {
      setClientName(c.name);
      setClientNif(c.nif || "");
    }
  };

  const checkout = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!user || cart.length === 0) return;

    // Client-side guards before hitting DB
    if (cart.some((i) => !i.id || i.quantity < 1)) {
      setError("Carrinho contém itens inválidos.");
      return;
    }
    if (cart.some((i) => i.quantity > i.stock)) {
      setError("Quantidade superior ao stock disponível.");
      return;
    }
    if (paymentMethod === "CASH" && paid + 0.011 < total) {
      setError("Valor entregue inferior ao total da fatura.");
      return;
    }

    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await createSale({
        items: cart.map((i) => ({
          id: Number(i.id),
          name: i.name,
          trackingCode: i.trackingCode,
          price: Number(i.price),
          cost: Number(i.cost ?? 0),
          quantity: Number(i.quantity),
        })),
        operatorId: Number(user.id),
        operatorName: user.name,
        clientId: clientId ? parseInt(clientId, 10) : null,
        clientName: clientName || null,
        clientNif: clientNif || null,
        paymentMethod,
        amountPaid: Number(paid),
        discount: Number(disc) || 0,
        taxRate: Number(taxRate) || 0,
        notes: notes || null,
      });
      setMsg(
        `Venda ${res.invoiceNumber} concluída` +
          (res.changeGiven > 0 ? ` · Troco ${moneyShort(res.changeGiven)}` : "")
      );
      setCart([]);
      setDiscount("");
      setNotes("");
      setAmountPaid("");
      setClientId("");
      setClientName("");
      setClientNif("");
      // Refresh stock from DB
      setParts(await listParts());
      const full = await getSaleFull(res.saleId);
      if (full) {
        setPreview({
          sale: full.sale,
          items: full.items,
          settings: full.settings,
        });
      }
    } catch (err) {
      console.error("createSale error", err);
      setError(err instanceof Error ? err.message : "Erro ao processar venda");
      // Refresh parts in case stock changed
      try {
        setParts(await listParts());
      } catch {
        /* ignore */
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">POS · Nova Venda</h1>
      <p className="page-sub">
        Carrinho, desconto, IVA, valor entregue, troco automático e fatura com QR.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-ok">{msg}</div>}

      <div className="pos">
        <div className="card" style={{ maxHeight: "52dvh", overflow: "auto" }}>
          <div className="search-wrap mb-1">
            <Search />
            <input
              placeholder="Nome, código MAK ou código de barras…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="list">
            {filtered.length === 0 ? (
              <div className="empty">Sem produtos com stock.</div>
            ) : (
              filtered.map((p) => (
                <div key={p.id} className="list-item">
                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt=""
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div className="meta">
                    <h3>{p.name}</h3>
                    <p>
                      {p.trackingCode} · Stock {p.stock}
                    </p>
                    <div className="price" style={{ marginTop: 4 }}>
                      {moneyShort(p.price)}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => addToCart(p)}
                    type="button"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <form className="card pos-cart" onSubmit={checkout}>
          <div className="flex-between mb-1">
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800 }}>
              <ShoppingCart size={20} /> Fatura
            </div>
            <span className="badge badge-blue">{cart.length}</span>
          </div>

          {cart.length === 0 ? (
            <div className="empty" style={{ padding: "0.75rem 0" }}>
              Adicione produtos.
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-line">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fw-bold" style={{ fontSize: "0.9rem" }}>
                    {item.name}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                    {moneyShort(item.price)} × {item.quantity}
                  </div>
                </div>
                <div className="qty">
                  <button type="button" onClick={() => changeQty(item.id!, -1)}>
                    −
                  </button>
                  <span style={{ minWidth: 18, textAlign: "center", fontWeight: 700 }}>
                    {item.quantity}
                  </span>
                  <button type="button" onClick={() => changeQty(item.id!, 1)}>
                    +
                  </button>
                </div>
                <div className="fw-bold" style={{ minWidth: 72, textAlign: "right" }}>
                  {moneyShort(item.price * item.quantity)}
                </div>
                <button type="button" onClick={() => remove(item.id!)}>
                  <Trash2 size={16} color="#dc2626" />
                </button>
              </div>
            ))
          )}

          <div className="field mt-1">
            <label>Cliente (opcional)</label>
            <select value={clientId} onChange={(e) => onClientPick(e.target.value)}>
              <option value="">Consumidor final</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="row-2">
            <div className="field">
              <label>Nome cliente</label>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="field">
              <label>NIF cliente</label>
              <input value={clientNif} onChange={(e) => setClientNif(e.target.value)} />
            </div>
          </div>

          <div className="row-2">
            <div className="field">
              <label>Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Desconto (Kz)</label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
          </div>

          <div className="row-2">
            <div className="field">
              <label>Valor entregue (Kz)</label>
              <input
                type="number"
                inputMode="decimal"
                required
                min={0}
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Troco (auto)</label>
              <input readOnly value={moneyShort(change)} style={{ fontWeight: 800, color: "#059669" }} />
            </div>
          </div>

          <div className="field">
            <label>Notas</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
          </div>

          <div style={{ background: "#f8fafc", borderRadius: 12, padding: "0.75rem" }}>
            <div className="flex-between">
              <span className="text-muted">Subtotal</span>
              <span>{moneyShort(subtotal)}</span>
            </div>
            {disc > 0 && (
              <div className="flex-between">
                <span className="text-muted">Desconto</span>
                <span>-{moneyShort(disc)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex-between">
                <span className="text-muted">IVA ({taxRate}%)</span>
                <span>{moneyShort(tax)}</span>
              </div>
            )}
            <div className="flex-between mt-1" style={{ fontSize: "1.25rem", fontWeight: 900 }}>
              <span>TOTAL</span>
              <span style={{ color: "#059669" }}>{moneyShort(total)}</span>
            </div>
          </div>

          <button
            className="btn btn-success btn-block mt-1"
            disabled={cart.length === 0 || busy}
            type="submit"
          >
            {busy ? "A processar…" : "Fechar venda + Pré-visualizar fatura"}
          </button>
        </form>
      </div>

      {preview && (
        <InvoicePreview
          open={!!preview}
          onClose={() => setPreview(null)}
          sale={preview.sale}
          items={preview.items}
          settings={preview.settings}
          copyLabel="ORIGINAL"
        />
      )}
    </div>
  );
}
