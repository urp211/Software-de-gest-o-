import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { createSale, listParts, moneyShort } from "../lib/db";
import { useAuth } from "../hooks/useAuth";

type PartRow = Awaited<ReturnType<typeof listParts>>[number];
type CartItem = PartRow & { quantity: number };

export default function POSPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [parts, setParts] = useState<PartRow[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listParts().then(setParts);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parts.filter((p) => p.stock > 0);
    return parts.filter(
      (p) =>
        p.stock > 0 &&
        (p.name.toLowerCase().includes(q) || p.trackingCode.toLowerCase().includes(q))
    );
  }, [parts, search]);

  const total = cart.reduce((a, i) => a + i.price * i.quantity, 0);

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
          if (next < 1) return i;
          if (next > i.stock) return i;
          return { ...i, quantity: next };
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const remove = (id: number) => setCart((prev) => prev.filter((i) => i.id !== id));

  const checkout = async () => {
    if (!user || cart.length === 0) return;
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await createSale(
        cart.map((i) => ({
          id: i.id!,
          price: i.price,
          cost: i.cost,
          quantity: i.quantity,
        })),
        user.id
      );
      setMsg(`Venda concluída · ${res.invoiceNumber}`);
      setCart([]);
      setParts(await listParts());
      setTimeout(() => navigate("/sales"), 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao processar venda");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">POS · Nova Venda</h1>
      <p className="page-sub">Adicione produtos e emita a fatura localmente.</p>

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-ok">{msg}</div>}

      <div className="pos">
        <div className="card" style={{ maxHeight: "60dvh", overflow: "auto" }}>
          <div className="search-wrap mb-1">
            <Search />
            <input
              placeholder="Buscar por nome ou código…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="list">
            {filtered.length === 0 ? (
              <div className="empty">Sem produtos com stock.</div>
            ) : (
              filtered.map((p) => (
                <div key={p.id} className="list-item">
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
                    aria-label="Adicionar"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card pos-cart">
          <div className="flex-between mb-1">
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800 }}>
              <ShoppingCart size={20} /> Fatura Atual
            </div>
            <span className="badge badge-blue">{cart.length}</span>
          </div>

          {cart.length === 0 ? (
            <div className="empty" style={{ padding: "1rem 0" }}>
              Adicione produtos para iniciar a venda.
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
                <button type="button" onClick={() => remove(item.id!)} aria-label="Remover">
                  <Trash2 size={16} color="#dc2626" />
                </button>
              </div>
            ))
          )}

          <div className="flex-between mt-2" style={{ paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
            <span className="text-muted">Total a pagar</span>
            <span style={{ fontSize: "1.35rem", fontWeight: 900, color: "#059669" }}>
              {moneyShort(total)}
            </span>
          </div>
          <button
            className="btn btn-success btn-block mt-1"
            disabled={cart.length === 0 || busy}
            onClick={checkout}
          >
            {busy ? "A processar…" : "Emitir Fatura / Fechar Venda"}
          </button>
        </div>
      </div>
    </div>
  );
}
