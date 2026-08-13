"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Draggable from "react-draggable";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Wrench,
  Calculator,
  FileText
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Vendas / Faturação", href: "/dashboard/sales", icon: ShoppingCart },
    { name: "Estoque / Peças", href: "/dashboard/inventory", icon: Package },
    { name: "Operadores", href: "/dashboard/operators", icon: Users },
    { name: "Calculadora de Lucros", href: "/dashboard/calculator", icon: Calculator },
    { name: "Extratos / Relatórios", href: "/dashboard/reports", icon: FileText },
    { name: "Configurações", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-widest uppercase">MAKINA</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-slate-300">Modo Local (Windows 7/Web)</span>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 relative">
        {children}
      </main>

      {/* Floating Draggable Menu */}
      {mounted && (
        <Draggable bounds="parent" handle=".handle">
          <div className="absolute z-50 flex flex-col bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden w-64" style={{ top: 20, left: 20, position: 'absolute' }}>
            <div className="handle bg-slate-800 text-white p-3 cursor-move flex justify-between items-center">
              <span className="font-semibold text-sm">Menu Flutuante</span>
              <Menu className="w-4 h-4" />
            </div>
            <div className="p-2 space-y-1 bg-white">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive 
                        ? "bg-blue-50 text-blue-700 font-medium" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </Draggable>
      )}
    </div>
  );
}
