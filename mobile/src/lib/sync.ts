/**
 * Multi-device company tracking code + local data sync package.
 *
 * Each installation binds to a company tracking code (ex: MAK-ORG-XXXX).
 * Admin can export a "company pack" (JSON) containing users/settings/stock
 * that other devices import using the same tracking code — enabling
 * multi-device login without a central server (offline-first).
 */

import { db, exportBackup, getSettings, logAudit, seedIfNeeded } from "./db";

const ORG_KEY = "makina_org_tracking_v1";
const DEVICE_KEY = "makina_device_id_v1";

export type OrgBinding = {
  trackingCode: string;
  companyName: string;
  boundAt: number;
  deviceId: string;
  deviceLabel?: string;
};

export type CompanyPack = {
  app: "MAKINA";
  kind: "company-pack";
  version: 3;
  trackingCode: string;
  companyName: string;
  exportedAt: string;
  exportedBy?: string;
  /** Full offline dataset */
  data: Record<string, unknown[]>;
};

function genDeviceId() {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const id =
    "DEV-" +
    Math.random().toString(36).slice(2, 6).toUpperCase() +
    "-" +
    Date.now().toString(36).toUpperCase();
  localStorage.setItem(DEVICE_KEY, id);
  return id;
}

export function getDeviceId() {
  return genDeviceId();
}

/** Generate a human-friendly company tracking code */
export function generateTrackingCode(companyName?: string) {
  const slug = (companyName || "ORG")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 4)
    .toUpperCase() || "ORG";
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const year = new Date().getFullYear().toString().slice(-2);
  return `MAK-${slug}-${year}${rand}`;
}

export function getOrgBinding(): OrgBinding | null {
  try {
    const raw = localStorage.getItem(ORG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OrgBinding;
  } catch {
    return null;
  }
}

export function saveOrgBinding(b: OrgBinding) {
  localStorage.setItem(ORG_KEY, JSON.stringify(b));
}

export function clearOrgBinding() {
  localStorage.removeItem(ORG_KEY);
}

/** Ensure this device has a company tracking code (create on first admin boot) */
export async function ensureOrgTracking(companyName?: string): Promise<OrgBinding> {
  await seedIfNeeded();
  const existing = getOrgBinding();
  if (existing?.trackingCode) return existing;

  const settings = await getSettings();
  // Persist on settings row if already set
  const code =
    (settings as { orgTrackingCode?: string }).orgTrackingCode ||
    generateTrackingCode(companyName || settings.companyName);

  const binding: OrgBinding = {
    trackingCode: code,
    companyName: companyName || settings.companyName || "MAKINA Company",
    boundAt: Date.now(),
    deviceId: getDeviceId(),
  };
  saveOrgBinding(binding);

  try {
    await db.settings.toCollection().modify({
      orgTrackingCode: code,
    } as never);
  } catch {
    /* column may not exist on old rows — updateSettings handles partial */
  }

  return binding;
}

export async function exportCompanyPack(exportedBy?: string): Promise<CompanyPack> {
  const binding = await ensureOrgTracking();
  const backup = await exportBackup();
  const pack: CompanyPack = {
    app: "MAKINA",
    kind: "company-pack",
    version: 3,
    trackingCode: binding.trackingCode,
    companyName: binding.companyName,
    exportedAt: new Date().toISOString(),
    exportedBy,
    data: backup.data,
  };
  await logAudit("COMPANY_PACK_EXPORT", binding.trackingCode, {
    name: exportedBy,
  });
  return pack;
}

/**
 * Import company pack on a secondary device.
 * Requires the tracking code to match (case-insensitive).
 */
export async function importCompanyPack(
  pack: CompanyPack,
  trackingCodeInput: string,
  deviceLabel?: string
) {
  if (!pack || pack.app !== "MAKINA" || !pack.data) {
    throw new Error("Pacote de empresa inválido.");
  }
  const expected = (pack.trackingCode || "").trim().toUpperCase();
  const provided = trackingCodeInput.trim().toUpperCase();
  if (!expected || expected !== provided) {
    throw new Error(
      "Código de rastreamento não confere com o pacote. Verifique o código da empresa."
    );
  }

  // Import tables (same as backup restore)
  const tables = Object.keys(pack.data);
  await db.transaction("rw", db.tables, async () => {
    for (const t of tables) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const table = (db as any)[t];
      if (!table) continue;
      await table.clear();
      const rows = pack.data[t] || [];
      if (rows.length) await table.bulkAdd(rows);
    }
  });

  const binding: OrgBinding = {
    trackingCode: expected,
    companyName: pack.companyName || "MAKINA",
    boundAt: Date.now(),
    deviceId: getDeviceId(),
    deviceLabel: deviceLabel || undefined,
  };
  saveOrgBinding(binding);

  try {
    await db.settings.toCollection().modify({
      orgTrackingCode: expected,
    } as never);
  } catch {
    /* ignore */
  }

  await logAudit(
    "COMPANY_PACK_IMPORT",
    `${expected} · device ${binding.deviceId}`,
    null
  );

  return binding;
}

/** Validate tracking code format MAK-XXXX-... */
export function isValidTrackingFormat(code: string) {
  return /^MAK-[A-Z0-9]{2,8}-[A-Z0-9]{4,12}$/i.test(code.trim());
}
