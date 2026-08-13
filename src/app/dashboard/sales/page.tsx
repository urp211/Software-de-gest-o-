import { getDb } from "@/db";
import { sales } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { ShoppingCart, FileText } from "lucide-react";
import { ensureDb } from "@/lib/with-db";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  await ensureDb();
  const db = await getDb();
  const allSales = await db.select().from(sales).orderBy(desc(sales.createdAt));

  return (
    <div className="max-w-6xl mx-auto pt-8 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Faturação e Vendas</h2>
          <p className="text-slate-500">
            Gestão de vendas, faturas e clientes (Padrão AGT).
          </p>
        </div>
        <Link
          href="/dashboard/sales/new"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Nova Venda (POS)</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Fatura Nº
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total (Kz)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {allSales.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  Nenhuma venda registada.
                </td>
              </tr>
            ) : (
              allSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {sale.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {sale.createdAt
                      ? new Date(sale.createdAt).toLocaleString("pt-AO")
                      : ""}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        sale.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sale.status === "COMPLETED" ? "Concluída" : "Cancelada"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right font-medium">
                    {Number(sale.totalAmount).toLocaleString("pt-AO")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver / Imprimir Fatura"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
