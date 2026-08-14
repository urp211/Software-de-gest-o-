import { FormEvent, useEffect, useState } from "react";
import { Truck, UserPlus } from "lucide-react";
import { addSupplier, listSuppliers, type Supplier } from "../lib/enterprise";
import { useAuth } from "../hooks/useAuth";

export default function SuppliersPage() {
  const { user, can } = useAuth();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    company: "",
    nif: "",
    phone: "",
    email: "",
    address: "",
    contact: "",
    bank: "",
    account: "",
  });

  const load = async (query = q) => setRows(await listSuppliers(query));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user) return;
    try {
      await addSupplier(form, { id: user.id, name: user.name, role: user.role });
      setOpen(false);
      setForm({
        name: "",
        company: "",
        nif: "",
        phone: "",
        email: "",
        address: "",
        contact: "",
        bank: "",
        account: "",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  };

  return (
    <div>
      <h1 className="page-title">Fornecedores</h1>
      <p className="page-sub">Cadastro e histórico de fornecedores.</p>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <input
          style={{
            flex: 1,
            minHeight: 48,
            borderRadius: 12,
            border: "1px solid #cbd5e1",
            padding: "0 12px",
          }}
          placeholder="Pesquisar fornecedor…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            load(e.target.value);
          }}
        />
        {can("suppliers.create") && (
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <UserPlus size={16} /> Novo
          </button>
        )}
      </div>

      <div className="list">
        {rows.length === 0 ? (
          <div className="card empty">Sem fornecedores.</div>
        ) : (
          rows.map((s) => (
            <div key={s.id} className="list-item">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#e0e7ff",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Truck size={20} color="#4338ca" />
              </div>
              <div className="meta">
                <h3>{s.name}</h3>
                <p>
                  {s.code}
                  {s.nif ? ` · NIF ${s.nif}` : ""}
                  {s.phone ? ` · ${s.phone}` : ""}
                </p>
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
            <strong>Novo fornecedor</strong>
            <form onSubmit={onSubmit} className="mt-1">
              <div className="field">
                <label>Nome</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="row-2">
                <div className="field">
                  <label>Empresa</label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>NIF</label>
                  <input
                    value={form.nif}
                    onChange={(e) => setForm({ ...form, nif: e.target.value })}
                  />
                </div>
              </div>
              <div className="row-2">
                <div className="field">
                  <label>Telefone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="field">
                <label>Morada</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
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
