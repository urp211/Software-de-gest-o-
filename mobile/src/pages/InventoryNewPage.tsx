import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ImagePlus, Package } from "lucide-react";
import {
  addPart,
  listWarehouses,
  type PartCondition,
  type Warehouse,
} from "../lib/db";
import { fileToCompressedDataUrl } from "../lib/image";
import { useAuth } from "../hooks/useAuth";
import { AdminOnly } from "../components/AdminOnly";
import { hapticSuccess, pickPhoto, takePhoto } from "../lib/device";

function Form() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    condition: "NEW" as PartCondition,
    price: "",
    cost: "",
    stock: "",
    minStock: "5",
    warehouseId: "",
    category: "",
    brand: "",
    barcode: "",
  });

  useEffect(() => {
    listWarehouses().then(setWarehouses);
  }, []);

  const onPhoto = async (file?: File | null) => {
    if (!file) return;
    try {
      const data = await fileToCompressedDataUrl(file);
      setPreview(data);
    } catch {
      setError("Não foi possível processar a foto.");
    }
  };

  const captureNative = async (mode: "camera" | "gallery") => {
    setError("");
    try {
      const data = mode === "camera" ? await takePhoto() : await pickPhoto();
      if (data) {
        setPreview(data);
        await hapticSuccess();
      }
    } catch {
      setError("Permissão de câmara/galeria necessária.");
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setOk("");
    setLoading(true);
    try {
      const res = await addPart(
        {
          name: form.name,
          description: form.description,
          condition: form.condition,
          price: parseFloat(form.price),
          cost: parseFloat(form.cost),
          stock: parseInt(form.stock, 10),
          minStock: parseInt(form.minStock || "5", 10),
          warehouseId: form.warehouseId ? parseInt(form.warehouseId, 10) : null,
          imageUrl: preview,
          category: form.category || null,
          brand: form.brand || null,
          barcode: form.barcode || null,
        },
        { id: user.id, name: user.name, role: user.role }
      );
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
      <p className="page-sub">Foto, custos e stock — só administrador.</p>

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

        <div className="field">
          <label>Foto do produto</label>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 14,
                background: "#f1f5f9",
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
              }}
            >
              {preview ? (
                <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Camera color="#94a3b8" />
              )}
            </div>
            <div className="fab-row">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => captureNative("camera")}>
                <Camera size={16} /> Câmara
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => captureNative("gallery")}>
                <ImagePlus size={16} /> Galeria
              </button>
              <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
                Ficheiro
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={(e) => onPhoto(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>
        </div>

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
            <label>Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="row-2">
            <div className="field">
              <label>Categoria</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex: Travões"
              />
            </div>
            <div className="field">
              <label>Marca</label>
              <input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>
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
          <div className="row-2">
            <div className="field">
              <label>Stock inicial</label>
              <input
                type="number"
                inputMode="numeric"
                required
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Alerta stock mínimo</label>
              <input
                type="number"
                inputMode="numeric"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Código de barras (opcional)</label>
            <input
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
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

export default function InventoryNewPage() {
  return (
    <AdminOnly>
      <Form />
    </AdminOnly>
  );
}
