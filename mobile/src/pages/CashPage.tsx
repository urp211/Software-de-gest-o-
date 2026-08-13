import { FormEvent, useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import {
  closeCashSession,
  getOpenCashSession,
  moneyShort,
  openCashSession,
  type CashSession,
} from "../lib/db";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../lib/format";

export default function CashPage() {
  const { user } = useAuth();
  const [session, setSession] = useState<CashSession | null | undefined>(undefined);
  const [floatAmt, setFloatAmt] = useState("0");
  const [closing, setClosing] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    expected: number;
    diff: number;
    cashSales: number;
  } | null>(null);

  const reload = async () => {
    if (!user) return;
    setSession(await getOpenCashSession(user.id));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onOpen = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    try {
      await openCashSession(
        { id: user.id, name: user.name },
        parseFloat(floatAmt) || 0
      );
      setMsg("Caixa aberta.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  };

  const onClose = async (e: FormEvent) => {
    e.preventDefault();
    if (!session?.id) return;
    setError("");
    try {
      const r = await closeCashSession(session.id, parseFloat(closing) || 0, notes);
      setResult(r);
      setMsg("Caixa fechada.");
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  };

  if (session === undefined) return <div className="empty">A carregar…</div>;

  return (
    <div>
      <h1 className="page-title">Caixa / Turno</h1>
      <p className="page-sub">Abertura, fecho e conferência de numerário.</p>

      {msg && <div className="alert alert-ok">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!session ? (
        <div className="card">
          <div className="flex-between mb-2">
            <strong style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Wallet size={18} /> Abrir caixa
            </strong>
          </div>
          <form onSubmit={onOpen}>
            <div className="field">
              <label>Fundo de troco inicial (Kz)</label>
              <input
                type="number"
                inputMode="decimal"
                value={floatAmt}
                onChange={(e) => setFloatAmt(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Abrir turno
            </button>
          </form>
        </div>
      ) : (
        <div className="card">
          <div className="badge badge-green mb-1">CAIXA ABERTA</div>
          <div className="stack">
            <div className="flex-between">
              <span className="text-muted">Operador</span>
              <strong>{session.operatorName}</strong>
            </div>
            <div className="flex-between">
              <span className="text-muted">Aberta em</span>
              <span>{formatDate(session.openedAt)}</span>
            </div>
            <div className="flex-between">
              <span className="text-muted">Fundo inicial</span>
              <strong>{moneyShort(session.openingFloat)}</strong>
            </div>
          </div>
          <form onSubmit={onClose} className="mt-2">
            <div className="field">
              <label>Numerário contado no fecho (Kz)</label>
              <input
                type="number"
                inputMode="decimal"
                required
                value={closing}
                onChange={(e) => setClosing(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Notas</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button className="btn btn-danger" type="submit">
              Fechar caixa
            </button>
          </form>
        </div>
      )}

      {result && (
        <div className="card mt-2">
          <h3 style={{ marginTop: 0 }}>Resultado do fecho</h3>
          <div className="flex-between">
            <span>Vendas em numerário</span>
            <strong>{moneyShort(result.cashSales)}</strong>
          </div>
          <div className="flex-between">
            <span>Esperado em caixa</span>
            <strong>{moneyShort(result.expected)}</strong>
          </div>
          <div className="flex-between">
            <span>Diferença</span>
            <strong style={{ color: result.diff === 0 ? "#059669" : "#dc2626" }}>
              {moneyShort(result.diff)}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
