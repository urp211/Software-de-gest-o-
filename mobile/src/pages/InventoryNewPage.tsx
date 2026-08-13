import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import { addPart, listWarehouses, type PartCondition, type Warehouse } from "../lib/db";

export default function InventoryNewPage() {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    condition: "NEW" as PartCondition,
    price: "",
    cost: "",
    stock: "",
    warehouseId: "",
  });

  useEffect(() => {
    listWarehouses().then(setWarehouses);
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setOk("");
    setLoading(true);
    try {
      const res = await addPart({
        name: form.name,
        description: form.description,
        condition: form.condition,
        price: parseFloat(form.price),
        cost: parseFloat(form.cost),
        stock: parseInt(form.stock, 10),
        warehouseId: form.warehouseId ? parseInt(form.warehouseId, 10) : null,
      });
      setOk(`Peça criada · ${res.trackingCode}`);
      setTimeout(() => navigate("/inventory"), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Cadastrar Peça</h1>
      <p className="page-sub">O código de rastreio é gerado automaticamente.</p>

      <div className="card">
        <div className="flex-between mb-2">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div
              style={{
                background: "#dbeafe",
                color: "#2563eb",
                borderRadius: 12,
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Package size={20} />
            </div>
            <strong>Nova peça no stock</strong>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {ok && <div className="alert alert-ok">{ok}</div>}

        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Nome da Peça</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Descrição (opcional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="row-2">
            <div className="field">
              <label>Estado</label>
              <select
                value={form.condition}
                onChange={(e) =>
                  setForm({ ...form, condition: e.target.value as PartCondition })
                }
              >
                <option value="NEW">Nova</option>
                <option value="USED">Usada</option>
              </select>
            </div>
            <div className="field">
              <label>Armazém</label>
              <select
                value={form.warehouseId}
                onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
              >
                <option value="">Selecione…</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="row-2">
            <div className="field">
              <label>Custo (Kz)</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                required
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Preço Venda (Kz)</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Estoque Inicial</label>
            <input
              type="number"
              inputMode="numeric"
              required
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>

          <div className="fab-row">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
              Cancelar
            </button>
            <button className="btn btn-primary" disabled={loading} type="submit">
              {loading ? "A guardar…" : "Guardar Peça"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
