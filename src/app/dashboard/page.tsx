import { getDb } from "@/db";
import { parts, sales, announcements } from "@/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { ensureDb } from "@/lib/with-db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await ensureDb();
  const db = await getDb();
  const session = await getSession();

  const totalPartsData = await db
    .select({ count: sql<number>`count(*)` })
    .from(parts);
  const totalParts = totalPartsData[0]?.count ?? 0;

  const totalSalesData = await db
    .select({
      total: sql<number>`coalesce(sum(total_amount), 0)`,
      profit: sql<number>`coalesce(sum(profit), 0)`,
    })
    .from(sales)
    .where(eq(sales.status, "COMPLETED"));
  const totalRevenue = totalSalesData[0]?.total || 0;
  const totalProfit = totalSalesData[0]?.profit || 0;

  const latestAnnouncements = await db.query.announcements.findMany({
    orderBy: [desc(announcements.createdAt)],
    limit: 5,
    with: {
      admin: true,
    },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pt-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Visão Geral do Sistema</h2>
        <p className="text-slate-500">Bem-vindo ao painel de controle MAKINA.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
          <h3 className="text-slate-500 font-medium text-sm mb-1">Total em Estoque (Peças)</h3>
          <p className="text-3xl font-bold text-slate-800">{totalParts}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
          <h3 className="text-slate-500 font-medium text-sm mb-1">Receita Total (Kz)</h3>
          <p className="text-3xl font-bold text-emerald-600">
            {Number(totalRevenue).toLocaleString("pt-AO", {
              style: "currency",
              currency: "AOA",
            })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500">
          <h3 className="text-slate-500 font-medium text-sm mb-1">Lucro Estimado (Kz)</h3>
          <p className="text-3xl font-bold text-purple-600">
            {Number(totalProfit).toLocaleString("pt-AO", {
              style: "currency",
              currency: "AOA",
            })}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-50">
          <h3 className="text-lg font-bold text-amber-900">Comunicados da Administração</h3>
          {session?.role === "ADMIN" && (
            <button className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700">
              Novo Comunicado
            </button>
          )}
        </div>
        <div className="p-6 space-y-4">
          {latestAnnouncements.length === 0 ? (
            <p className="text-slate-500 italic text-center py-4">
              Nenhum comunicado no momento.
            </p>
          ) : (
            latestAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm"
              >
                <p className="text-slate-800 mb-2">{ann.message}</p>
                <div className="text-xs text-slate-500 flex justify-between items-center">
                  <span>Publicado por: Administração</span>
                  <span>
                    {ann.createdAt
                      ? new Date(ann.createdAt).toLocaleString("pt-AO")
                      : ""}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
