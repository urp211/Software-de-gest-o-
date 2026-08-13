import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackagePlus, Search, Barcode } from "lucide-react";
import { listParts, moneyShort } from "../lib/db";

type Row = Awaited<ReturnType<typeof listParts>>[number];

export default function InventoryPage() {
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
      <p className="page-sub">Gestão de armazém e peças auto (offline).</p>

      <div className="toolbar">
        <div className="search-wrap">
          <Search />
          <input
            placeholder="Buscar peça ou código…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              load(e.target.value);
            }}
          />
        </div>
        <Link to="/inventory/new" className="btn btn-primary">
          <PackagePlus size={18} /> Nova Peça
        </Link>
      </div>

      {loading ? (
        <div className="empty">A carregar…</div>
      ) : parts.length === 0 ? (
        <div className="card empty">Nenhuma peça encontrada no estoque.</div>
      ) : (
        <div className="list">
          {parts.map((p) => (
            <div key={p.id} className="list-item">
              <div className="meta">
                <h3>{p.name}</h3>
                <p style={{ marginBottom: 6 }}>{p.warehouseName}</p>
                <div className="chip-code">
                  <Barcode size={12} /> {p.trackingCode}
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span className={`badge ${p.condition === "NEW" ? "badge-blue" : "badge-orange"}`}>
                    {p.condition === "NEW" ? "Nova" : "Usada"}
                  </span>
                  <span
                    className="fw-bold"
                    style={{
                      color: p.stock > 5 ? "#059669" : p.stock > 0 ? "#d97706" : "#dc2626",
                    }}
                  >
                    Stock: {p.stock}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="price">{moneyShort(p.price)}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                  Custo {moneyShort(p.cost)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
