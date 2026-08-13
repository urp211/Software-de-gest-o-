import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, UserPlus } from "lucide-react";
import { listUsers, type User as U } from "../lib/db";
import { formatDateShort } from "../lib/format";
import { useAuth } from "../hooks/useAuth";

export default function OperatorsPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<U[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="page-title">Operadores</h1>
      <p className="page-sub">Utilizadores e permissões neste dispositivo.</p>

      {user?.role === "ADMIN" && (
        <div className="toolbar">
          <div />
          <Link to="/operators/new" className="btn btn-primary">
            <UserPlus size={18} /> Novo Operador
          </Link>
        </div>
      )}

      {loading ? (
        <div className="empty">A carregar…</div>
      ) : (
        <div className="list">
          {users.map((u) => (
            <div key={u.id} className="list-item">
              <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#f1f5f9",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <User size={20} color="#94a3b8" />
                </div>
                <div className="meta">
                  <h3>{u.name}</h3>
                  <p>@{u.username}</p>
                  <div style={{ marginTop: 6 }}>
                    <span className={`badge ${u.role === "ADMIN" ? "badge-purple" : "badge-green"}`}>
                      {u.role}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                {formatDateShort(u.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
