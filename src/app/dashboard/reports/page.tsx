import { getDb } from "@/db";
import { sales, parts } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { FileText } from "lucide-react";
import { ensureDb } from "@/lib/with-db";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await ensureDb();
  const db = await getDb();

  const completed = await db
    .select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(total_amount), 0)`,
      profit: sql<number>`coalesce(sum(profit), 0)`,
    })
    .from(sales)
    .where(eq(sales.status, "COMPLETED"));

  const stockValue = await db
    .select({
      value: sql<number>`coalesce(sum(price * stock), 0)`,
      units: sql<number>`coalesce(sum(stock), 0)`,
    })
    .from(parts);

  const recent = await db.select().from(sales).orderBy(desc(sales.createdAt)).limit(20);

  const stats = completed[0] || { count: 0, revenue: 0, profit: 0 };
  const stock = stockValue[0] || { value: 0, units: 0 };

  return (
    <div className="max-w-6xl mx-auto pt-8 space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Extratos / Relatórios</h2>
          <p className="text-slate-500">Resumo financeiro e de stock (padrão AGT).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Vendas concluídas</p>
          <p className="text-2xl font-bold text-slate-800">{stats.count}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Receita total</p>
          <p className="text-2xl font-bold text-emerald-600">
            {Number(stats.revenue).toLocaleString("pt-AO")} Kz
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Lucro total</p>
          <p className="text-2xl font-bold text-purple-600">
            {Number(stats.profit).toLocaleString("pt-AO")} Kz
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Valor em stock</p>
          <p className="text-2xl font-bold text-blue-600">
            {Number(stock.value).toLocaleString("pt-AO")} Kz
          </p>
          <p className="text-xs text-slate-400">{stock.units} unidades</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-semibold text-slate-700">
          Últimas 20 vendas
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Fatura
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Data
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                Lucro
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {recent.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  Sem dados para relatório.
                </td>
              </tr>
            ) : (
              recent.map((s) => (
                <tr key={s.id}>
                  <td className="px-6 py-3 text-sm font-mono">{s.invoiceNumber}</td>
                  <td className="px-6 py-3 text-sm text-slate-500">
                    {s.createdAt ? new Date(s.createdAt).toLocaleString("pt-AO") : ""}
                  </td>
                  <td className="px-6 py-3 text-sm text-right">
                    {Number(s.totalAmount).toLocaleString("pt-AO")} Kz
                  </td>
                  <td className="px-6 py-3 text-sm text-right text-purple-600">
                    {Number(s.profit).toLocaleString("pt-AO")} Kz
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
