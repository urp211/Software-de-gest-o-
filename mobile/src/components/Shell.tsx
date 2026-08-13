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
  TrendingUp,
  Wallet,
  Receipt,
  UserCircle2,
  ShieldCheck,
  ScrollText,
  Landmark,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const primary = [
  { to: "/", label: "Início", icon: LayoutDashboard, end: true },
  { to: "/sales", label: "Vendas", icon: ShoppingCart },
  { to: "/inventory", label: "Stock", icon: Package },
  { to: "/accounting", label: "Conta", icon: TrendingUp },
];

export function Shell() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();

  const moreItems = [
    { to: "/sales/new", label: "Nova Venda (POS)", icon: ShoppingCart },
    ...(isAdmin
      ? [{ to: "/inventory/new", label: "Nova Peça", icon: Package }]
      : []),
    { to: "/clients", label: "Clientes", icon: UserCircle2 },
    { to: "/cash", label: "Caixa / Turno", icon: Wallet },
    ...(isAdmin
      ? [
          { to: "/expenses", label: "Despesas", icon: Receipt },
          { to: "/operators", label: "Operadores", icon: Users },
          { to: "/approvals", label: "Autorizações 2ª via", icon: ShieldCheck },
          { to: "/audit", label: "Auditoria", icon: ScrollText },
          { to: "/accounting", label: "Contabilidade avançada", icon: Landmark },
        ]
      : []),
    { to: "/reports", label: "Relatórios / Extrato A4", icon: FileText },
    { to: "/calculator", label: "Calculadora", icon: Calculator },
    { to: "/settings", label: "Configurações & Backup", icon: Settings },
  ];

  const sideItems = [
    ...primary,
    { to: "/clients", label: "Clientes", icon: UserCircle2 },
    { to: "/cash", label: "Caixa", icon: Wallet },
    ...(isAdmin
      ? [
          { to: "/expenses", label: "Despesas", icon: Receipt },
          { to: "/operators", label: "Operadores", icon: Users },
          { to: "/approvals", label: "Autorizações", icon: ShieldCheck },
          { to: "/audit", label: "Auditoria", icon: ScrollText },
        ]
      : []),
    { to: "/reports", label: "Relatórios", icon: FileText },
    { to: "/calculator", label: "Calculadora", icon: Calculator },
    { to: "/settings", label: "Configurações", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <nav className="side-nav" aria-label="Menu lateral">
        <div className="side-brand">
          <div className="mark">
            <Wrench size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, letterSpacing: "0.18em" }}>MAKINA</div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              {user?.name} · {isAdmin ? "Admin" : "Operador"}
            </div>
          </div>
        </div>
        {sideItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              end={"end" in item ? Boolean((item as { end?: boolean }).end) : false}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        <button
          className="sheet-item"
          style={{ color: "#fca5a5", marginTop: "0.5rem" }}
          onClick={handleLogout}
          type="button"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
        <div className="side-footer">
          <div className="offline-pill" style={{ marginBottom: "0.5rem" }}>
            <WifiOff size={12} /> Offline Pro
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
              <small>
                {user?.name} · {isAdmin ? "Admin" : "Operador"}
              </small>
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
            <div
              style={{ fontWeight: 800, marginBottom: "0.5rem", padding: "0 0.5rem" }}
            >
              Menu profissional
            </div>
            {moreItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.to + item.label}
                  className="sheet-item"
                  type="button"
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
              type="button"
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
