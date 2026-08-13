import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addUser, type Role } from "../lib/db";
import { useAuth } from "../hooks/useAuth";

export default function OperatorNewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "OPERATOR" as Role,
    autoLogoutTime: "",
  });

  if (user?.role !== "ADMIN") {
    return (
      <div className="card alert alert-error">
        Apenas administradores podem criar operadores.
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await addUser({
        name: form.name,
        username: form.username,
        password: form.password,
        role: form.role,
        autoLogoutTime: form.autoLogoutTime
          ? parseInt(form.autoLogoutTime, 10)
          : null,
      });
      navigate("/operators");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar operador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Novo Operador</h1>
      <p className="page-sub">Crie um utilizador local neste telemóvel/tablet.</p>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Nome Completo</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Nome de Utilizador</label>
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoCapitalize="none"
            />
          </div>
          <div className="field">
            <label>Palavra-passe</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="row-2">
            <div className="field">
              <label>Função</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                <option value="OPERATOR">Operador</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div className="field">
              <label>Pausa automática (min)</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Opcional"
                value={form.autoLogoutTime}
                onChange={(e) => setForm({ ...form, autoLogoutTime: e.target.value })}
              />
            </div>
          </div>
          <div className="fab-row">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
              Cancelar
            </button>
            <button className="btn btn-primary" disabled={loading} type="submit">
              {loading ? "A guardar…" : "Guardar Operador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
