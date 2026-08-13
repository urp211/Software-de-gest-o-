import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Wrench, WifiOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("MAKINA");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) navigate("/", { replace: true });
  }, [ready, user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(username, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="login-screen">
      <div className="login-hero">
        <div className="mark">
          <Wrench color="white" size={32} />
        </div>
        <h1>MAKINA</h1>
        <p>Software de Gestão Avançada</p>
        <div style={{ marginTop: "0.75rem" }}>
          <span className="offline-pill">
            <WifiOff size={12} /> 100% Offline · Mobile
          </span>
        </div>
      </div>

      <div className="login-card">
        <h2 style={{ margin: "0 0 1rem", textAlign: "center", fontSize: "1.15rem" }}>
          Acesso ao Sistema
        </h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={onSubmit}>
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
            {loading ? "A entrar…" : "Entrar no Sistema"}
          </button>
        </form>

        <div className="login-footer">
          <div>Desenvolvido por Makina Company / Raul Lourenço</div>
          <div>Conforme com os requisitos AGT — Angola</div>
          <div style={{ marginTop: "0.5rem", opacity: 0.8 }}>
            Padrão: MAKINA / admmakina
          </div>
        </div>
      </div>
    </div>
  );
}
