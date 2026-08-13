import { getDb } from "@/db";
import { parts } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { PackagePlus, Search, Edit, Barcode } from "lucide-react";
import { ensureDb } from "@/lib/with-db";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await ensureDb();
  const db = await getDb();
  const params = await searchParams;
  const query = params.q || "";

  const allParts = await db.query.parts.findMany({
    orderBy: [desc(parts.createdAt)],
    with: {
      warehouse: true,
    },
  });

  const filteredParts = query
    ? allParts.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.trackingCode.toLowerCase().includes(query.toLowerCase())
      )
    : allParts;

  return (
    <div className="max-w-6xl mx-auto pt-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Estoque de Peças</h2>
          <p className="text-slate-500">Gestão de armazém e peças auto.</p>
        </div>

        <div className="flex w-full md:w-auto space-x-3">
          <form className="relative flex-1 md:w-64" action="/dashboard/inventory" method="get">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              name="q"
              placeholder="Buscar peça ou código..."
              defaultValue={query}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </form>
          <Link
            href="/dashboard/inventory/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors whitespace-nowrap"
          >
            <PackagePlus className="w-5 h-5" />
            <span>Nova Peça</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Peça
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Preço (Kz)
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Estoque
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredParts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Nenhuma peça encontrada no estoque.
                </td>
              </tr>
            ) : (
              filteredParts.map((part) => (
                <tr key={part.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 text-slate-900 font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                      <Barcode className="w-4 h-4 text-slate-500" />
                      <span>{part.trackingCode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{part.name}</div>
                    <div className="text-xs text-slate-500">
                      {part.warehouse?.name || "Sem armazém"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        part.condition === "NEW"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {part.condition === "NEW" ? "Nova" : "Usada"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right font-medium">
                    {Number(part.price).toLocaleString("pt-AO")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`text-sm font-bold ${
                        part.stock > 5
                          ? "text-green-600"
                          : part.stock > 0
                            ? "text-orange-500"
                            : "text-red-600"
                      }`}
                    >
                      {part.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="w-5 h-5" />
                    </button>
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
