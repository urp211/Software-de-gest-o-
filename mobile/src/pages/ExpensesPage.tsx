import { FormEvent, useEffect, useState } from "react";
import {
  addExpense,
  EXPENSE_LABELS,
  listExpenses,
  moneyShort,
  type Expense,
  type ExpenseCategory,
} from "../lib/db";
import { useAuth } from "../hooks/useAuth";
import { AdminOnly } from "../components/AdminOnly";
import { formatDateShort } from "../lib/format";

function Body() {
  const { user } = useAuth();
  const [items, setItems] = useState<Expense[]>([]);
  const [form, setForm] = useState({
    category: "OTHER" as ExpenseCategory,
    description: "",
    amount: "",
  });
  const [msg, setMsg] = useState("");

  const load = () => listExpenses().then(setItems);
  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await addExpense(
      {
        category: form.category,
        description: form.description,
        amount: parseFloat(form.amount),
      },
      { id: user.id, name: user.name, role: user.role }
    );
    setForm({ category: "OTHER", description: "", amount: "" });
    setMsg("Despesa registada.");
    await load();
  };

  const total = items.reduce((a, e) => a + e.amount, 0);

  return (
    <div>
      <h1 className="page-title">Despesas</h1>
      <p className="page-sub">Controlo de custos operacionais (admin).</p>
      {msg && <div className="alert alert-ok">{msg}</div>}

      <div className="card mb-2">
        <form onSubmit={onSubmit}>
          <div className="row-2">
            <div className="field">
              <label>Categoria</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as ExpenseCategory })
                }
              >
                {Object.entries(EXPENSE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Valor (Kz)</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Descrição</label>
            <input
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Registar despesa
          </button>
        </form>
      </div>

      <div className="stat emerald mb-2">
        <label>Total despesas</label>
        <strong>{moneyShort(total)}</strong>
      </div>

      <div className="list">
        {items.map((e) => (
          <div key={e.id} className="list-item">
            <div className="meta">
              <h3>{EXPENSE_LABELS[e.category]}</h3>
              <p>
                {e.description} · {formatDateShort(e.date)}
              </p>
            </div>
            <div className="price">{moneyShort(e.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <AdminOnly>
      <Body />
    </AdminOnly>
  );
}
