import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackagePlus, Search, Barcode } from "lucide-react";
import { listParts, moneyShort } from "../lib/db";
import { useAuth } from "../hooks/useAuth";

type Row = Awaited<ReturnType<typeof listParts>>[number];

export default function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [q, setQ] = useState("");
  const [parts, setParts] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (query = q) => {
    setLoading(true);
    try {
      setParts(await listParts(query));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 className="page-title">Estoque de Peças</h1>
      <p className="page-sub">
        {isAdmin
          ? "Gestão completa de armazém (com custos e fotos)."
          : "Consulta de stock disponível para venda (sem custos/lucros)."}
      </p>

      <div className="toolbar">
        <div className="search-wrap">
          <Search />
          <input
            placeholder="Buscar peça, código ou categoria…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              load(e.target.value);
            }}
          />
        </div>
        {isAdmin ? (
          <Link to="/inventory/new" className="btn btn-primary">
            <PackagePlus size={18} /> Nova Peça
          </Link>
        ) : (
          <div className="alert alert-info" style={{ margin: 0, padding: "0.55rem 0.75rem" }}>
            Só admin adiciona stock
          </div>
        )}
      </div>

      {loading ? (
        <div className="empty">A carregar…</div>
      ) : parts.length === 0 ? (
        <div className="card empty">Nenhuma peça encontrada.</div>
      ) : (
        <div className="list">
          {parts.map((p) => (
            <div key={p.id} className="list-item">
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt=""
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    objectFit: "cover",
                    flexShrink: 0,
                    background: "#f1f5f9",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: "#f1f5f9",
                    flexShrink: 0,
                  }}
                />
              )}
              <div className="meta">
                <h3>{p.name}</h3>
                <p style={{ marginBottom: 6 }}>
                  {p.warehouseName}
                  {p.category ? ` · ${p.category}` : ""}
                </p>
                <div className="chip-code">
                  <Barcode size={12} /> {p.trackingCode}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span
                    className={`badge ${p.condition === "NEW" ? "badge-blue" : "badge-orange"}`}
                  >
                    {p.condition === "NEW" ? "Nova" : "Usada"}
                  </span>
                  <span
                    className="fw-bold"
                    style={{
                      color:
                        p.stock > 5 ? "#059669" : p.stock > 0 ? "#d97706" : "#dc2626",
                    }}
                  >
                    Stock: {p.stock}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="price">{moneyShort(p.price)}</div>
                {isAdmin && (
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                    Custo {moneyShort(p.cost)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
