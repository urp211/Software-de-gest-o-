import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Shell } from "./components/Shell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import InventoryNewPage from "./pages/InventoryNewPage";
import SalesPage from "./pages/SalesPage";
import POSPage from "./pages/POSPage";
import OperatorsPage from "./pages/OperatorsPage";
import OperatorNewPage from "./pages/OperatorNewPage";
import ReportsPage from "./pages/ReportsPage";
import CalculatorPage from "./pages/CalculatorPage";
import SettingsPage from "./pages/SettingsPage";
import AccountingPage from "./pages/AccountingPage";
import CashPage from "./pages/CashPage";
import ExpensesPage from "./pages/ExpensesPage";
import ClientsPage from "./pages/ClientsPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import AuditPage from "./pages/AuditPage";

function Private({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="login-screen">
        <div className="login-hero">
          <div className="mark">M</div>
          <h1>MAKINA</h1>
          <p>A preparar dados offline…</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <Private>
              <Shell />
            </Private>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/new" element={<InventoryNewPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="sales/new" element={<POSPage />} />
          <Route path="operators" element={<OperatorsPage />} />
          <Route path="operators/new" element={<OperatorNewPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="accounting" element={<AccountingPage />} />
          <Route path="cash" element={<CashPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="approvals" element={<ApprovalsPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="calculator" element={<CalculatorPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
