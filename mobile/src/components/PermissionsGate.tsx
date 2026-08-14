import { useEffect, useState } from "react";
import {
  Camera,
  Bell,
  HardDrive,
  Wifi,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import {
  checkPermissions,
  getDeviceInfo,
  getSavedPermissionPrompted,
  requestAllPermissions,
  type DevicePermissionMap,
} from "../lib/device";

const LABELS: Record<keyof DevicePermissionMap, { title: string; desc: string; icon: typeof Camera }> = {
  camera: {
    title: "Câmara",
    desc: "Fotografar produtos e anexar às peças / documentos.",
    icon: Camera,
  },
  photos: {
    title: "Galeria",
    desc: "Selecionar imagens existentes do dispositivo.",
    icon: Camera,
  },
  notifications: {
    title: "Notificações",
    desc: "Alertas de stock baixo, fecho de caixa e avisos.",
    icon: Bell,
  },
  storage: {
    title: "Armazenamento",
    desc: "Guardar backups e exportar extratos no telemóvel.",
    icon: HardDrive,
  },
  network: {
    title: "Rede",
    desc: "Detetar estado online/offline (a app funciona offline).",
    icon: Wifi,
  },
};

type Props = {
  onDone: () => void;
};

export function PermissionsGate({ onDone }: Props) {
  const [perms, setPerms] = useState<DevicePermissionMap | null>(null);
  const [device, setDevice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    checkPermissions().then(setPerms);
    getDeviceInfo().then((d) =>
      setDevice([d.platform, d.model, d.osVersion].filter(Boolean).join(" · "))
    );
  }, []);

  // Auto-skip if already prompted once this install
  useEffect(() => {
    if (getSavedPermissionPrompted()) {
      // still allow manual re-request from settings; gate only first time after login
      onDone();
    }
  }, [onDone]);

  if (getSavedPermissionPrompted()) return null;

  const ask = async () => {
    setBusy(true);
    try {
      const r = await requestAllPermissions();
      setPerms(r);
      setTimeout(onDone, 400);
    } finally {
      setBusy(false);
    }
  };

  const skip = () => {
    // Mark so we don't loop; user can enable later in settings
    requestAllPermissions().finally(onDone);
  };

  return (
    <div className="login-screen" style={{ justifyContent: "flex-start", paddingTop: "calc(2rem + env(safe-area-inset-top))" }}>
      <div className="login-card" style={{ maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#2563eb",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 0.75rem",
            }}
          >
            <ShieldCheck color="#fff" size={28} />
          </div>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Permissões do dispositivo</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: "0.5rem 0 0" }}>
            Para integrar câmara, ficheiros e alertas, o MAKINA precisa da sua autorização.
            Pode alterar depois em Definições do sistema.
          </p>
          {device && (
            <div
              className="offline-pill"
              style={{ marginTop: 10, display: "inline-flex", gap: 6 }}
            >
              <Smartphone size={12} /> {device}
            </div>
          )}
        </div>

        <div className="stack">
          {(Object.keys(LABELS) as (keyof DevicePermissionMap)[]).map((key) => {
            const meta = LABELS[key];
            const Icon = meta.icon;
            const state = perms?.[key] || "prompt";
            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: "0.65rem 0",
                  borderBottom: "1px solid #334155",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#0f172a",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color="#60a5fa" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{meta.title}</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{meta.desc}</div>
                </div>
                <span
                  className={`badge ${
                    state === "granted"
                      ? "badge-green"
                      : state === "denied"
                        ? "badge-red"
                        : "badge-blue"
                  }`}
                >
                  {state === "granted"
                    ? "OK"
                    : state === "denied"
                      ? "Negada"
                      : state === "unavailable"
                        ? "N/D"
                        : "Pedir"}
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="btn btn-primary btn-block mt-2"
          disabled={busy}
          onClick={ask}
        >
          {busy ? "A pedir permissões…" : "Permitir e continuar"}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-block mt-1"
          style={{ color: "#cbd5e1", borderColor: "#475569" }}
          onClick={skip}
        >
          Agora não
        </button>
        <p style={{ color: "#64748b", fontSize: "0.75rem", textAlign: "center", marginTop: 12 }}>
          Os dados da empresa continuam 100% locais neste dispositivo.
        </p>
      </div>
    </div>
  );
}
