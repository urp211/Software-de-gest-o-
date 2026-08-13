import { FormEvent, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { addClient, listClients, type Client } from "../lib/db";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    nif: "",
    phone: "",
    email: "",
    address: "",
  });

  const load = async (query = q) => setClients(await listClients(query));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await addClient(form);
    setForm({ name: "", nif: "", phone: "", email: "", address: "" });
    setOpen(false);
    await load();
  };

  return (
    <div>
      <h1 className="page-title">Clientes</h1>
      <p className="page-sub">Cadastro local para faturação com NIF.</p>

      <div className="toolbar">
        <input
          className="search-wrap"
          style={{
            flex: 1,
            minHeight: 48,
            borderRadius: 12,
            border: "1px solid #cbd5e1",
            padding: "0 12px",
          }}
          placeholder="Pesquisar…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            load(e.target.value);
          }}
        />
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          <UserPlus size={16} /> Novo
        </button>
      </div>

      <div className="list">
        {clients.length === 0 ? (
          <div className="card empty">Sem clientes.</div>
        ) : (
          clients.map((c) => (
            <div key={c.id} className="list-item">
              <div className="meta">
                <h3>{c.name}</h3>
                <p>
                  {c.nif ? `NIF ${c.nif}` : "Sem NIF"}
                  {c.phone ? ` · ${c.phone}` : ""}
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
            <strong>Novo cliente</strong>
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
                  <label>NIF</label>
                  <input
                    value={form.nif}
                    onChange={(e) => setForm({ ...form, nif: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Telefone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
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
