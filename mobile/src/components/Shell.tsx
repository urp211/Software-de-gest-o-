import { useEffect, useState } from "react";
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
  Truck,
  ShoppingBag,
  FileSpreadsheet,
  Bell,
  Scale,
  ClipboardList,
  Banknote,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ROLE_LABELS, normalizeRole } from "../lib/roles";
import { listNotifications } from "../lib/enterprise";

const primary = [
  { to: "/", label: "Início", icon: LayoutDashboard, end: true },
  { to: "/sales", label: "Vendas", icon: ShoppingCart },
  { to: "/inventory", label: "Stock", icon: Package },
  { to: "/accounting", label: "Financ.", icon: TrendingUp },
];

export function Shell() {
  const { user, logout, can } = useAuth();
  const role = normalizeRole(user?.role);
  const roleLabel = ROLE_LABELS[role] || user?.role || "";
  const [moreOpen, setMoreOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    listNotifications(user.id, 50).then((n) =>
      setUnread(n.filter((x) => !x.read).length)
    );
  }, [user]);

  const moreItems = [
    { to: "/sales/new", label: "Nova Venda (POS)", icon: ShoppingCart, show: can("sales.create") },
    { to: "/inventory/new", label: "Novo produto", icon: Package, show: can("inventory.create") },
    { to: "/purchases", label: "Compras", icon: ShoppingBag, show: can("purchases.view") },
    { to: "/quotes", label: "Orçamentos", icon: FileSpreadsheet, show: can("quotes.view") },
    { to: "/services", label: "Serviços / OS", icon: Wrench, show: can("services.view") },
    { to: "/clients", label: "Clientes", icon: UserCircle2, show: can("clients.view") },
    { to: "/suppliers", label: "Fornecedores", icon: Truck, show: can("suppliers.view") },
    { to: "/cash", label: "Caixa / Turno", icon: Wallet, show: can("cash.view") || can("cash.operate") },
    { to: "/expenses", label: "Despesas", icon: Receipt, show: can("finance.view") },
    { to: "/payables", label: "Contas a pagar", icon: Banknote, show: can("finance.view") },
    { to: "/receivables", label: "Contas a receber", icon: ClipboardList, show: can("finance.view") },
    { to: "/operators", label: "Utilizadores", icon: Users, show: can("users.view") },
    { to: "/approvals", label: "Aprovações", icon: ShieldCheck, show: can("approvals.manage") },
    { to: "/audit", label: "Auditoria", icon: ScrollText, show: can("audit.view") },
    { to: "/accounting", label: "Indicadores / Contabilidade", icon: Landmark, show: can("reports.view") },
    { to: "/reports", label: "Relatórios / Extrato A4", icon: FileText, show: can("reports.view") },
    { to: "/notifications", label: "Notificações", icon: Bell, show: true },
    { to: "/calculator", label: "Calculadora", icon: Calculator, show: true },
    { to: "/settings", label: "Configurações & Backup", icon: Settings, show: can("settings.view") },
    { to: "/legal?tab=terms", label: "Termos e Condições", icon: Scale, show: true },
    { to: "/legal?tab=privacy", label: "Privacidade", icon: Scale, show: true },
  ].filter((i) => i.show);

  const sideItems = [
    ...primary,
    { to: "/purchases", label: "Compras", icon: ShoppingBag, show: can("purchases.view") },
    { to: "/clients", label: "Clientes", icon: UserCircle2, show: can("clients.view") },
    { to: "/suppliers", label: "Fornecedores", icon: Truck, show: can("suppliers.view") },
    { to: "/cash", label: "Caixa", icon: Wallet, show: can("cash.view") || can("cash.operate") },
    { to: "/payables", label: "A pagar", icon: Banknote, show: can("finance.view") },
    { to: "/receivables", label: "A receber", icon: ClipboardList, show: can("finance.view") },
    { to: "/services", label: "Serviços", icon: Wrench, show: can("services.view") },
    { to: "/operators", label: "Utilizadores", icon: Users, show: can("users.view") },
    { to: "/audit", label: "Auditoria", icon: ScrollText, show: can("audit.view") },
    { to: "/reports", label: "Relatórios", icon: FileText, show: can("reports.view") },
    { to: "/notifications", label: "Alertas", icon: Bell, show: true },
    { to: "/settings", label: "Configurações", icon: Settings, show: can("settings.view") },
  ].filter((i) => i.show);

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
              {user?.name} · {roleLabel}
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
              {item.to === "/notifications" && unread > 0 && (
                <span className="badge badge-red" style={{ marginLeft: "auto" }}>
                  {unread}
                </span>
              )}
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
            <WifiOff size={12} /> Enterprise Offline
          </div>
          Makina · AGT Angola
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
                {user?.name} · {roleLabel}
              </small>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              className="offline-pill"
              style={{ border: "none", cursor: "pointer", position: "relative" }}
              onClick={() => navigate("/notifications")}
              aria-label="Notificações"
            >
              <Bell size={14} />
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "#dc2626",
                    color: "#fff",
                    borderRadius: 999,
                    fontSize: 10,
                    minWidth: 16,
                    height: 16,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {unread}
                </span>
              )}
            </button>
            <span className="offline-pill">
              <WifiOff size={12} /> Offline
            </span>
          </div>
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
            position: "relative",
          }}
        >
          <MoreHorizontal size={22} />
          <span>Mais</span>
          {unread > 0 && (
            <span
              style={{
                position: "absolute",
                top: 6,
                right: "28%",
                width: 8,
                height: 8,
                borderRadius: 99,
                background: "#dc2626",
              }}
            />
          )}
        </button>
      </nav>

      {moreOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setMoreOpen(false)} />
          <div className="sheet" role="dialog" aria-label="Mais opções">
            <div className="sheet-handle" />
            <div style={{ fontWeight: 800, marginBottom: "0.5rem", padding: "0 0.5rem" }}>
              Menu empresarial
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
