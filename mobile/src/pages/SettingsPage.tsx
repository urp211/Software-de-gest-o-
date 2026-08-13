import { FormEvent, useEffect, useState } from "react";
import { Settings, Database, Smartphone } from "lucide-react";
import { getSettings, updateSettings } from "../lib/db";
import { useAuth } from "../hooks/useAuth";

export default function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    companyName: "",
    nif: "",
    address: "",
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSettings().then((s) =>
      setForm({
        companyName: s.companyName || "",
        nif: s.nif || "",
        address: s.address || "",
      })
    );
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (user?.role !== "ADMIN") return;
    setLoading(true);
    setMsg("");
    try {
      await updateSettings(form);
      setMsg("Configurações guardadas neste dispositivo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Configurações</h1>
      <p className="page-sub">Empresa e sistema local offline.</p>

      <div className="card mb-2">
        <div className="flex-between mb-2">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div
              style={{
                background: "#f1f5f9",
                borderRadius: 12,
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Settings size={20} />
            </div>
            <strong>Dados da empresa</strong>
          </div>
        </div>

        {msg && <div className="alert alert-ok">{msg}</div>}

        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Empresa</label>
            <input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              disabled={user?.role !== "ADMIN"}
            />
          </div>
          <div className="field">
            <label>NIF</label>
            <input
              value={form.nif}
              onChange={(e) => setForm({ ...form, nif: e.target.value })}
              disabled={user?.role !== "ADMIN"}
            />
          </div>
          <div className="field">
            <label>Morada</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              disabled={user?.role !== "ADMIN"}
            />
          </div>
          {user?.role === "ADMIN" && (
            <button className="btn btn-primary" disabled={loading} type="submit">
              {loading ? "A guardar…" : "Guardar"}
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <div className="stack">
          <div className="flex-between">
            <span className="text-muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Database size={16} /> Base de dados
            </span>
            <strong style={{ fontSize: "0.9rem" }}>IndexedDB (local)</strong>
          </div>
          <div className="flex-between">
            <span className="text-muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Smartphone size={16} /> Modo
            </span>
            <strong style={{ fontSize: "0.9rem" }}>Mobile Offline</strong>
          </div>
        </div>

        <div className="alert alert-info mt-2" style={{ marginBottom: 0 }}>
          <div className="fw-bold mb-1">Credenciais padrão</div>
          <div>
            Utilizador: <code>MAKINA</code>
          </div>
          <div>
            Palavra-passe: <code>admmakina</code>
          </div>
          <div className="mt-1" style={{ fontSize: "0.85rem" }}>
            Todos os dados ficam apenas neste dispositivo. Sem internet necessária.
          </div>
        </div>
      </div>
    </div>
  );
}
