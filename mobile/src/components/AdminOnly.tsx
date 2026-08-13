import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ADMIN") {
    return (
      <div className="card alert alert-error">
        Acesso restrito ao administrador.
      </div>
    );
  }
  return <>{children}</>;
}
