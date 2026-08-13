import { getDb } from "@/db";
import { Settings } from "lucide-react";
import { ensureDb } from "@/lib/with-db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await ensureDb();
  const db = await getDb();
  const row = await db.query.settings.findFirst();

  return (
    <div className="max-w-2xl mx-auto pt-8 space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-slate-100 p-2 rounded-lg text-slate-700">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
            <p className="text-slate-500 text-sm">Dados da empresa e sistema local.</p>
          </div>
        </div>

        <dl className="space-y-4">
          <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
            <dt className="text-sm font-medium text-slate-500">Empresa</dt>
            <dd className="col-span-2 text-slate-900 font-semibold">
              {row?.companyName || "MAKINA Company"}
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
            <dt className="text-sm font-medium text-slate-500">NIF</dt>
            <dd className="col-span-2 text-slate-900">{row?.nif || "000000000"}</dd>
          </div>
          <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
            <dt className="text-sm font-medium text-slate-500">Morada</dt>
            <dd className="col-span-2 text-slate-900">{row?.address || "Luanda, Angola"}</dd>
          </div>
          <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
            <dt className="text-sm font-medium text-slate-500">Base de dados</dt>
            <dd className="col-span-2 text-slate-900 font-mono text-sm">SQLite local (embutida)</dd>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <dt className="text-sm font-medium text-slate-500">Modo</dt>
            <dd className="col-span-2 text-slate-900">Desktop / Offline (Windows)</dd>
          </div>
        </dl>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
          <p className="font-semibold mb-1">Credenciais padrão do administrador</p>
          <p>
            Utilizador: <span className="font-mono">MAKINA</span>
          </p>
          <p>
            Palavra-passe: <span className="font-mono">admmakina</span>
          </p>
          <p className="mt-2 text-blue-600">Altere a password após o primeiro acesso em produção.</p>
        </div>
      </div>
    </div>
  );
}
