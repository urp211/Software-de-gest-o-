import { FormEvent, useEffect, useState } from "react";
import {
  createService,
  listServices,
  updateServiceStatus,
  type ServiceOrder,
  type ServiceStatus,
} from "../lib/enterprise";
import { listClients, moneyShort } from "../lib/db";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../lib/format";
import { Wrench } from "lucide-react";

export default function ServicesPage() {
  const { user, can } = useAuth();
  const [rows, setRows] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Awaited<ReturnType<typeof listClients>>>([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    clientId: "",
    title: "",
    description: "",
    laborCost: "",
    partsCost: "",
  });

  const load = async () => {
    setRows(await listServices());
    setClients(await listClients());
  };
  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const c = clients.find((x) => String(x.id) === form.clientId);
      const res = await createService(
        {
          clientId: form.clientId ? parseInt(form.clientId, 10) : null,
          clientName: c?.name || null,
          title: form.title,
          description: form.description,
          laborCost: parseFloat(form.laborCost) || 0,
          partsCost: parseFloat(form.partsCost) || 0,
          technicianId: user.id,
          technicianName: user.name,
        },
        { id: user.id, name: user.name, role: user.role }
      );
      setMsg(`OS ${res.number} criada`);
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  };

  const setStatus = async (id: number, status: ServiceStatus) => {
    if (!user) return;
    await updateServiceStatus(id, status, {
      id: user.id,
      name: user.name,
      role: user.role,
    });
    await load();
  };

  return (
    <div>
      <h1 className="page-title">Ordens de serviço</h1>
      <p className="page-sub">Oficina · mão de obra · materiais.</p>
      {msg && <div className="alert alert-ok">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <div />
        {can("services.create") && (
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Wrench size={16} /> Nova OS
          </button>
        )}
      </div>

      <div className="list">
        {rows.length === 0 ? (
          <div className="card empty">Sem serviços.</div>
        ) : (
          rows.map((s) => (
            <div key={s.id} className="list-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
              <div className="flex-between">
                <div>
                  <h3 style={{ margin: 0 }}>{s.title}</h3>
                  <p className="text-muted" style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
                    {s.number} · {s.clientName || "—"} · {formatDate(s.createdAt)}
                  </p>
                  <span className="badge badge-blue">{s.status}</span>
                </div>
                <div className="price">{moneyShort(s.totalAmount)}</div>
              </div>
              <div className="fab-row mt-1">
                {s.status === "OPEN" && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setStatus(s.id!, "IN_PROGRESS")}
                  >
                    Iniciar
                  </button>
                )}
                {s.status === "IN_PROGRESS" && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => setStatus(s.id!, "DONE")}
                  >
                    Concluir
                  </button>
                )}
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
            <strong>Nova ordem de serviço</strong>
            <form onSubmit={onSubmit} className="mt-1">
              <div className="field">
                <label>Cliente</label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                >
                  <option value="">—</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Título</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Descrição</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="row-2">
                <div className="field">
                  <label>Mão de obra (Kz)</label>
                  <input
                    type="number"
                    value={form.laborCost}
                    onChange={(e) => setForm({ ...form, laborCost: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Peças (Kz)</label>
                  <input
                    type="number"
                    value={form.partsCost}
                    onChange={(e) => setForm({ ...form, partsCost: e.target.value })}
                  />
                </div>
              </div>
              <button className="btn btn-primary btn-block" type="submit">
                Criar OS
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
