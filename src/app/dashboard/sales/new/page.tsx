"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Search, Plus, Trash2 } from "lucide-react";

export default function POSPage() {
  const router = useRouter();
  const [parts, setParts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/inventory/list").then(res => res.json()).then(data => setParts(data.parts || []));
  }, []);

  const filteredParts = parts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.trackingCode.toLowerCase().includes(search.toLowerCase()));

  const addToCart = (part: any) => {
    const existing = cart.find(item => item.id === part.id);
    if (existing) {
      if (existing.quantity >= part.stock) return;
      setCart(cart.map(item => item.id === part.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      if (part.stock < 1) return;
      setCart([...cart, { ...part, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart }),
    });

    if (res.ok) {
      alert("Venda concluída com sucesso!");
      router.push("/dashboard/sales");
    } else {
      alert("Erro ao concluir venda.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row gap-6">
      {/* Products List */}
      <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[80vh]">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Produtos Disponíveis</h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {filteredParts.map(part => (
            <div key={part.id} className="flex justify-between items-center p-3 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
              <div>
                <h4 className="font-semibold text-slate-800">{part.name}</h4>
                <div className="text-xs text-slate-500 font-mono">{part.trackingCode} | Estoque: {part.stock}</div>
                <div className="text-blue-600 font-bold">{Number(part.price).toLocaleString('pt-AO')} Kz</div>
              </div>
              <button 
                onClick={() => addToCart(part)} 
                disabled={part.stock < 1}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-full md:w-96 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[80vh]">
        <div className="flex items-center space-x-2 mb-6 border-b border-slate-100 pb-4">
          <ShoppingCart className="w-6 h-6 text-slate-700" />
          <h2 className="text-xl font-bold text-slate-800">Fatura Atual</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {cart.length === 0 ? (
            <p className="text-center text-slate-500 text-sm mt-10">Adicione produtos para iniciar a venda.</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                <div className="flex-1">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-slate-500">{item.quantity} x {Number(item.price).toLocaleString('pt-AO')} Kz</div>
                </div>
                <div className="font-bold text-slate-800 mr-3">
                  {(item.quantity * item.price).toLocaleString('pt-AO')}
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-medium text-slate-600">Total a Pagar</span>
            <span className="text-2xl font-bold text-emerald-600">{total.toLocaleString('pt-AO')} Kz</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold text-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors uppercase tracking-wide"
          >
            Emitir Fatura / Fechar Venda
          </button>
        </div>
      </div>
    </div>
  );
}
