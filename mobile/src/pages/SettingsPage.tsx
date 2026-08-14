import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Settings,
  Database,
  Smartphone,
  Download,
  Upload,
  Shield,
  Share2,
  Bell,
  Camera,
  RefreshCw,
  Fingerprint,
  Copy,
} from "lucide-react";
import {
  exportBackup,
  getSettings,
  importBackup,
  updateSettings,
  addAnnouncement,
} from "../lib/db";
import { fileToCompressedDataUrl, readJsonFile, downloadJson } from "../lib/image";
import { useAuth } from "../hooks/useAuth";
import {
  checkPermissions,
  getDeviceInfo,
  getNetworkStatus,
  notifyLocal,
  requestAllPermissions,
  saveBackupToDevice,
  shareFileJson,
  type DevicePermissionMap,
} from "../lib/device";
import {
  ensureOrgTracking,
  exportCompanyPack,
  getOrgBinding,
  generateTrackingCode,
  saveOrgBinding,
  getDeviceId,
} from "../lib/sync";

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    companyName: "",
    nif: "",
    address: "",
    phone: "",
    email: "",
    thermalWidth: 58,
    taxRate: 0,
    invoiceFooter: "",
    allowOperatorSecondCopy: false,
    lowStockThreshold: 5,
    logoDataUrl: "" as string | null,
  });
  const [announce, setAnnounce] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [perms, setPerms] = useState<DevicePermissionMap | null>(null);
  const [deviceLabel, setDeviceLabel] = useState("");
  const [netLabel, setNetLabel] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [orgName, setOrgName] = useState("");

  const refreshDevice = async () => {
    const [p, d, n] = await Promise.all([
      checkPermissions(),
      getDeviceInfo(),
      getNetworkStatus(),
    ]);
    setPerms(p);
    setDeviceLabel([d.platform, d.model, d.osVersion].filter(Boolean).join(" · "));
    setNetLabel(n.connected ? `Online (${n.connectionType})` : "Offline");
  };

  useEffect(() => {
    getSettings().then(async (s) => {
      setForm({
        companyName: s.companyName || "",
        nif: s.nif || "",
        address: s.address || "",
        phone: s.phone || "",
        email: s.email || "",
        thermalWidth: s.thermalWidth || 58,
        taxRate: s.taxRate || 0,
        invoiceFooter: s.invoiceFooter || "",
        allowOperatorSecondCopy: !!s.allowOperatorSecondCopy,
        lowStockThreshold: s.lowStockThreshold ?? 5,
        logoDataUrl: s.logoDataUrl || null,
      });
      if (isAdmin) {
        const b = await ensureOrgTracking(s.companyName);
        setOrgCode(b.trackingCode);
        setOrgName(b.companyName);
        if (!s.orgTrackingCode) {
          await updateSettings({ orgTrackingCode: b.trackingCode });
        }
      } else {
        const b = getOrgBinding();
        if (b) {
          setOrgCode(b.trackingCode);
          setOrgName(b.companyName);
        }
      }
    });
    refreshDevice();
  }, [isAdmin]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setLoading(true);
    setMsg("");
    try {
      await updateSettings({
        companyName: form.companyName,
        nif: form.nif,
        address: form.address,
        phone: form.phone,
        email: form.email,
        thermalWidth: Number(form.thermalWidth) as 58 | 80,
        taxRate: Number(form.taxRate),
        invoiceFooter: form.invoiceFooter,
        allowOperatorSecondCopy: form.allowOperatorSecondCopy,
        lowStockThreshold: Number(form.lowStockThreshold),
        logoDataUrl: form.logoDataUrl,
      });
      setMsg("Configurações guardadas neste dispositivo.");
    } finally {
      setLoading(false);
    }
  };

  const onBackup = async () => {
    const data = await exportBackup();
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const filename = `MAKINA-backup-${stamp}.json`;
    const saved = await saveBackupToDevice(filename, data);
    if (saved.ok) {
      setMsg(`Backup guardado: ${saved.path}`);
      await notifyLocal("Backup MAKINA", `Ficheiro ${filename} criado.`);
    } else {
      setError(saved.error || "Falha no backup");
    }
  };

  const onShareBackup = async () => {
    const data = await exportBackup();
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const ok = await shareFileJson(`MAKINA-backup-${stamp}.json`, data);
    setMsg(ok ? "Partilha iniciada." : "Partilha indisponível neste dispositivo.");
  };

  const onRestore = async (file?: File | null) => {
    if (!file || !isAdmin) return;
    if (!confirm("Isto substitui TODOS os dados locais. Continuar?")) return;
    setError("");
    try {
      const payload = await readJsonFile<{ data: Record<string, unknown[]> }>(file);
      await importBackup(payload);
      setMsg("Backup restaurado. A recarregar…");
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no restore");
    }
  };

  const onLogo = async (file?: File | null) => {
    if (!file) return;
    const data = await fileToCompressedDataUrl(file, 400, 0.8);
    setForm((f) => ({ ...f, logoDataUrl: data }));
  };

  const publishAnnounce = async () => {
    if (!user || !announce.trim()) return;
    await addAnnouncement(announce, user.id);
    setAnnounce("");
    setMsg("Comunicado publicado.");
    await notifyLocal("Comunicado MAKINA", announce.slice(0, 80));
  };

  const askPerms = async () => {
    setBusyish(true);
    try {
      const r = await requestAllPermissions();
      setPerms(r);
      setMsg("Permissões atualizadas.");
      await notifyLocal("MAKINA", "Permissões do dispositivo configuradas.");
    } finally {
      setBusyish(false);
    }
  };

  const [busyish, setBusyish] = useState(false);

  const permBadge = (s?: string) => {
    if (s === "granted") return "badge-green";
    if (s === "denied") return "badge-red";
    if (s === "unavailable") return "badge-orange";
    return "badge-blue";
  };

  return (
    <div>
      <h1 className="page-title">Configurações</h1>
      <p className="page-sub">Empresa, dispositivo, faturação e backup offline.</p>

      {msg && <div className="alert alert-ok">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Multi-device company tracking */}
      <div className="card mb-2">
        <div className="flex-between mb-1">
          <strong style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Fingerprint size={18} /> Multi-dispositivo
          </strong>
        </div>
        <p className="text-muted" style={{ fontSize: "0.85rem" }}>
          Código de rastreamento da empresa — use o mesmo código em todos os
          telemóveis/tablets. Exporte o pacote no principal e importe nos outros.
        </p>
        <div
          style={{
            background: "#0f172a",
            color: "#e2e8f0",
            borderRadius: 12,
            padding: "0.85rem 1rem",
            fontFamily: "ui-monospace, monospace",
            fontSize: "1.05rem",
            letterSpacing: "0.06em",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>{orgCode || "—"}</span>
          {orgCode && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: "#93c5fd", borderColor: "#334155" }}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(orgCode);
                  setMsg("Código copiado.");
                } catch {
                  setMsg(orgCode);
                }
              }}
            >
              <Copy size={14} />
            </button>
          )}
        </div>
        {orgName && (
          <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: 6 }}>
            {orgName}
          </div>
        )}
        {isAdmin && (
          <div className="fab-row mt-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                try {
                  const pack = await exportCompanyPack(user?.name);
                  const stamp = new Date()
                    .toISOString()
                    .slice(0, 19)
                    .replace(/[:T]/g, "-");
                  const filename = `MAKINA-empresa-${pack.trackingCode}-${stamp}.json`;
                  downloadJson(filename, pack);
                  await shareFileJson(filename, pack);
                  setMsg("Pacote da empresa exportado. Partilhe com os outros dispositivos.");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Falha ao exportar pacote");
                }
              }}
            >
              Exportar pacote da empresa
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={async () => {
                if (
                  !confirm(
                    "Gerar um NOVO código invalida o anterior nos outros dispositivos. Continuar?"
                  )
                )
                  return;
                const code = generateTrackingCode(form.companyName);
                await updateSettings({ orgTrackingCode: code });
                saveOrgBinding({
                  trackingCode: code,
                  companyName: form.companyName || orgName || "MAKINA",
                  boundAt: Date.now(),
                  deviceId: getDeviceId(),
                });
                setOrgCode(code);
                setMsg("Novo código gerado: " + code);
              }}
            >
              Gerar novo código
            </button>
          </div>
        )}
      </div>

      {/* Device & permissions */}
      <div className="card mb-2">
        <div className="flex-between mb-1">
          <strong style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Smartphone size={18} /> Dispositivo & permissões
          </strong>
          <button type="button" className="btn btn-ghost btn-sm" onClick={refreshDevice}>
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="text-muted" style={{ fontSize: "0.85rem", marginBottom: 10 }}>
          {deviceLabel || "A detetar…"} · {netLabel || "—"}
        </div>
        <div className="stack" style={{ gap: 8 }}>
          {[
            { k: "camera" as const, label: "Câmara", icon: Camera },
            { k: "photos" as const, label: "Galeria", icon: Camera },
            { k: "notifications" as const, label: "Notificações", icon: Bell },
            { k: "storage" as const, label: "Armazenamento", icon: Database },
            { k: "network" as const, label: "Rede", icon: Smartphone },
          ].map(({ k, label, icon: Icon }) => (
            <div key={k} className="flex-between">
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Icon size={16} /> {label}
              </span>
              <span className={`badge ${permBadge(perms?.[k])}`}>
                {perms?.[k] || "…"}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-block mt-2"
          disabled={busyish}
          onClick={askPerms}
        >
          <Shield size={16} /> Pedir / atualizar permissões
        </button>
      </div>

      <div className="card mb-2">
        <div className="flex-between mb-2">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div
              style={{
                background: "#f1f5f9",
                borderRadius: 12,
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Settings size={20} />
            </div>
            <strong>Dados da empresa</strong>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Empresa</label>
            <input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              disabled={!isAdmin}
            />
          </div>
          <div className="row-2">
            <div className="field">
              <label>NIF</label>
              <input
                value={form.nif}
                onChange={(e) => setForm({ ...form, nif: e.target.value })}
                disabled={!isAdmin}
              />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                disabled={!isAdmin}
              />
            </div>
          </div>
          <div className="field">
            <label>Morada</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              disabled={!isAdmin}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={!isAdmin}
            />
          </div>
          <div className="row-2">
            <div className="field">
              <label>Largura térmica</label>
              <select
                value={form.thermalWidth}
                onChange={(e) =>
                  setForm({ ...form, thermalWidth: parseInt(e.target.value, 10) })
                }
                disabled={!isAdmin}
              >
                <option value={58}>58 mm</option>
                <option value={80}>80 mm</option>
              </select>
            </div>
            <div className="field">
              <label>IVA padrão (%)</label>
              <input
                type="number"
                step="0.01"
                value={form.taxRate}
                onChange={(e) =>
                  setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })
                }
                disabled={!isAdmin}
              />
            </div>
          </div>
          <div className="field">
            <label>Rodapé da fatura</label>
            <input
              value={form.invoiceFooter}
              onChange={(e) => setForm({ ...form, invoiceFooter: e.target.value })}
              disabled={!isAdmin}
            />
          </div>
          <div className="field">
            <label>Alerta stock mínimo global</label>
            <input
              type="number"
              value={form.lowStockThreshold}
              onChange={(e) =>
                setForm({
                  ...form,
                  lowStockThreshold: parseInt(e.target.value, 10) || 5,
                })
              }
              disabled={!isAdmin}
            />
          </div>
          {isAdmin && (
            <label className="flex-between" style={{ marginBottom: 12 }}>
              <span>Operadores podem imprimir 2ª via sem pedido</span>
              <input
                type="checkbox"
                checked={form.allowOperatorSecondCopy}
                onChange={(e) =>
                  setForm({ ...form, allowOperatorSecondCopy: e.target.checked })
                }
              />
            </label>
          )}
          {isAdmin && (
            <div className="field">
              <label>Logótipo (faturas)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onLogo(e.target.files?.[0])}
              />
            </div>
          )}
          {isAdmin && (
            <button className="btn btn-primary" disabled={loading} type="submit">
              {loading ? "A guardar…" : "Guardar configurações"}
            </button>
          )}
        </form>
      </div>

      <div className="card mb-2">
        <div className="flex-between mb-1">
          <strong style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Database size={18} /> Backup & Restauro
          </strong>
        </div>
        <p className="text-muted" style={{ fontSize: "0.85rem" }}>
          Guarde ou partilhe um ficheiro JSON com todos os dados deste dispositivo.
        </p>
        <div className="fab-row">
          <button type="button" className="btn btn-primary" onClick={onBackup}>
            <Download size={16} /> Guardar backup
          </button>
          <button type="button" className="btn btn-ghost" onClick={onShareBackup}>
            <Share2 size={16} /> Partilhar
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={16} /> Restaurar
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => onRestore(e.target.files?.[0])}
              />
            </>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="card mb-2">
          <strong>Novo comunicado</strong>
          <div className="field mt-1">
            <textarea
              rows={2}
              value={announce}
              onChange={(e) => setAnnounce(e.target.value)}
              placeholder="Mensagem para todos os operadores…"
            />
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={publishAnnounce}>
            Publicar
          </button>
        </div>
      )}

      <div className="card">
        <div className="stack">
          <div className="flex-between">
            <span className="text-muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Database size={16} /> Base de dados
            </span>
            <strong style={{ fontSize: "0.9rem" }}>IndexedDB v3 (local)</strong>
          </div>
          <div className="flex-between">
            <span className="text-muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Smartphone size={16} /> Modo
            </span>
            <strong style={{ fontSize: "0.9rem" }}>Empresarial Offline</strong>
          </div>
          <div className="flex-between">
            <span className="text-muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Shield size={16} /> Perfil
            </span>
            <strong style={{ fontSize: "0.9rem" }}>
              {user?.role === "ADMIN" ? "Administrador" : "Operador"}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
