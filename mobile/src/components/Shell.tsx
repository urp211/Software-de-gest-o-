import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Calculator,
  MoreHorizontal,
  Users,
  FileText,
  Settings,
  LogOut,
  Wrench,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const primary = [
  { to: "/", label: "Início", icon: LayoutDashboard, end: true },
  { to: "/sales", label: "Vendas", icon: ShoppingCart },
  { to: "/inventory", label: "Stock", icon: Package },
  { to: "/calculator", label: "Calc", icon: Calculator },
];

const moreItems = [
  { to: "/sales/new", label: "Nova Venda (POS)", icon: ShoppingCart },
  { to: "/inventory/new", label: "Nova Peça", icon: Package },
  { to: "/operators", label: "Operadores", icon: Users },
  { to: "/reports", label: "Relatórios", icon: FileText },
  { to: "/settings", label: "Configurações", icon: Settings },
];

export function Shell() {
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      {/* Side nav — tablets/desktop */}
      <nav className="side-nav" aria-label="Menu lateral">
        <div className="side-brand">
          <div className="mark">
            <Wrench size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, letterSpacing: "0.18em" }}>MAKINA</div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{user?.name}</div>
          </div>
        </div>
        {[...primary, ...moreItems.filter((m) => m.to !== "/sales/new" && m.to !== "/inventory/new")].map(
          (item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item ? item.end : false}
                className={({ isActive }) => (isActive ? "active" : undefined)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          }
        )}
        <button
          className="sheet-item"
          style={{ color: "#fca5a5", marginTop: "0.5rem" }}
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
        <div className="side-footer">
          <div className="offline-pill" style={{ marginBottom: "0.5rem" }}>
            <WifiOff size={12} /> Offline
          </div>
          Makina Company · AGT Angola
        </div>
      </nav>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header className="app-header">
          <div className="brand">
            <div className="brand-mark">
              <Wrench size={18} />
            </div>
            <div>
              <h1>MAKINA</h1>
              <small>{user?.name} · {user?.role === "ADMIN" ? "Admin" : "Operador"}</small>
            </div>
          </div>
          <span className="offline-pill">
            <WifiOff size={12} /> Offline
          </span>
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — phones */}
      <nav className="bottom-nav" aria-label="Navegação principal">
        {primary.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              <Icon />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.2rem",
            color: moreOpen ? "var(--primary)" : "#94a3b8",
            fontSize: "0.65rem",
            fontWeight: 600,
            minHeight: "var(--nav-h)",
          }}
        >
          <MoreHorizontal size={22} />
          <span>Mais</span>
        </button>
      </nav>

      {moreOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setMoreOpen(false)} />
          <div className="sheet" role="dialog" aria-label="Mais opções">
            <div className="sheet-handle" />
            <div style={{ fontWeight: 800, marginBottom: "0.5rem", padding: "0 0.5rem" }}>
              Menu
            </div>
            {moreItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.to}
                  className="sheet-item"
                  onClick={() => {
                    setMoreOpen(false);
                    navigate(item.to);
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              className="sheet-item"
              style={{ color: "#dc2626" }}
              onClick={() => {
                setMoreOpen(false);
                handleLogout();
              }}
            >
              <LogOut size={20} />
              <span>Terminar sessão</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
