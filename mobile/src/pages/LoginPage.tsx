import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Fingerprint,
  Lock,
  User,
  Wrench,
  WifiOff,
  Upload,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  ensureOrgTracking,
  getOrgBinding,
  importCompanyPack,
  isValidTrackingFormat,
  type CompanyPack,
} from "../lib/sync";
import { readJsonFile } from "../lib/image";
import { seedIfNeeded } from "../lib/db";

type Mode = "login" | "link-device";

export default function LoginPage() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [orgLabel, setOrgLabel] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) navigate("/", { replace: true });
  }, [ready, user, navigate]);

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const b = getOrgBinding();
      if (b) {
        setOrgLabel(`${b.companyName} · ${b.trackingCode}`);
        setTrackingCode(b.trackingCode);
      }
    })();
  }, []);

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);
    try {
      // Ensure org code exists on primary device after first admin login
      const res = await login(username, password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Bind org tracking after successful auth if missing
      const binding = await ensureOrgTracking();
      setOrgLabel(`${binding.companyName} · ${binding.trackingCode}`);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  const onLinkDevice = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    if (!isValidTrackingFormat(trackingCode)) {
      setError("Formato inválido. Use o código da empresa (ex: MAK-ORG-25ABCD).");
      return;
    }
    setLoading(true);
    try {
      // Expect user to pick company pack file — if already imported just confirm binding
      const input = document.getElementById(
        "company-pack-file"
      ) as HTMLInputElement | null;
      const file = input?.files?.[0];
      if (!file) {
        setError("Selecione o pacote da empresa (.json) exportado no dispositivo principal.");
        setLoading(false);
        return;
      }
      const pack = await readJsonFile<CompanyPack>(file);
      const binding = await importCompanyPack(pack, trackingCode);
      setOrgLabel(`${binding.companyName} · ${binding.trackingCode}`);
      setMsg(
        "Dispositivo vinculado com sucesso. Agora entre com o seu utilizador e palavra-passe."
      );
      setMode("login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao vincular dispositivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-hero">
        <div className="mark">
          <Wrench color="white" size={32} />
        </div>
        <h1>MAKINA</h1>
        <p>Sistema de Gestão Empresarial</p>
        <div style={{ marginTop: "0.75rem" }}>
          <span className="offline-pill">
            <WifiOff size={12} /> Offline · Multi-dispositivo
          </span>
        </div>
        {orgLabel && (
          <div
            className="offline-pill"
            style={{ marginTop: 8, display: "inline-flex", gap: 6 }}
          >
            <Fingerprint size={12} /> {orgLabel}
          </div>
        )}
      </div>

      <div className="login-card">
        <div className="fab-row" style={{ marginBottom: "1rem", justifyContent: "center" }}>
          <button
            type="button"
            className={`btn btn-sm ${mode === "login" ? "btn-primary" : "btn-ghost"}`}
            style={mode !== "login" ? { color: "#e2e8f0", borderColor: "#475569" } : undefined}
            onClick={() => setMode("login")}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === "link-device" ? "btn-primary" : "btn-ghost"}`}
            style={mode !== "link-device" ? { color: "#e2e8f0", borderColor: "#475569" } : undefined}
            onClick={() => setMode("link-device")}
          >
            Vincular dispositivo
          </button>
        </div>

        <h2 style={{ margin: "0 0 1rem", textAlign: "center", fontSize: "1.15rem" }}>
          {mode === "login" ? "Acesso ao Sistema" : "Novo dispositivo"}
        </h2>

        {error && <div className="alert alert-error">{error}</div>}
        {msg && <div className="alert alert-ok">{msg}</div>}

        {mode === "login" ? (
          <form onSubmit={onLogin}>
            <div className="field">
              <label>Utilizador</label>
              <div style={{ position: "relative" }}>
                <User
                  size={18}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748b",
                  }}
                />
                <input
                  style={{ paddingLeft: 40 }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  inputMode="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="O seu utilizador"
                />
              </div>
            </div>

            <div className="field">
              <label>Palavra-passe</label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={18}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748b",
                  }}
                />
                <input
                  style={{ paddingLeft: 40 }}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button className="btn btn-primary btn-block" disabled={loading} type="submit">
              {loading ? "A autenticar…" : "Entrar"}
            </button>
          </form>
        ) : (
          <form onSubmit={onLinkDevice}>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 0 }}>
              No dispositivo principal (admin), exporte o <strong>pacote da empresa</strong>.
              Neste telemóvel, introduza o <strong>código de rastreamento</strong> e importe o ficheiro.
              Depois entre com o mesmo utilizador/palavra-passe.
            </p>
            <div className="field">
              <label>Código de rastreamento da empresa</label>
              <div style={{ position: "relative" }}>
                <Fingerprint
                  size={18}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748b",
                  }}
                />
                <input
                  style={{ paddingLeft: 40, textTransform: "uppercase" }}
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  required
                  placeholder="MAK-ORG-25ABCD"
                  autoCapitalize="characters"
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="field">
              <label>Pacote da empresa (.json)</label>
              <div style={{ position: "relative" }}>
                <Upload
                  size={18}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: 14,
                    color: "#64748b",
                  }}
                />
                <input
                  id="company-pack-file"
                  type="file"
                  accept="application/json,.json"
                  required
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>
            <button className="btn btn-primary btn-block" disabled={loading} type="submit">
              {loading ? "A vincular…" : "Vincular e continuar"}
            </button>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 8,
                alignItems: "center",
                color: "#64748b",
                fontSize: "0.8rem",
              }}
            >
              <Building2 size={14} /> Um código = uma empresa em vários dispositivos
            </div>
          </form>
        )}

        <div className="login-footer">
          <div>Makina Company · Gestão empresarial offline</div>
          <div>Conforme requisitos AGT — República de Angola</div>
        </div>
      </div>
    </div>
  );
}
