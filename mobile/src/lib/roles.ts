/** Granular RBAC for MAKINA Enterprise */

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGER"
  | "FINANCE"
  | "SELLER"
  | "WAREHOUSE"
  | "TECHNICIAN"
  | "AUDITOR"
  | "OPERATOR"; // legacy alias → SELLER

export type Permission =
  | "dashboard.view"
  | "sales.view"
  | "sales.create"
  | "sales.edit"
  | "sales.cancel"
  | "sales.print"
  | "sales.export"
  | "purchases.view"
  | "purchases.create"
  | "purchases.receive"
  | "inventory.view"
  | "inventory.create"
  | "inventory.edit"
  | "inventory.move"
  | "inventory.adjust"
  | "inventory.delete"
  | "clients.view"
  | "clients.create"
  | "clients.edit"
  | "suppliers.view"
  | "suppliers.create"
  | "suppliers.edit"
  | "finance.view"
  | "finance.create"
  | "finance.pay"
  | "cash.view"
  | "cash.operate"
  | "employees.view"
  | "employees.manage"
  | "reports.view"
  | "reports.export"
  | "audit.view"
  | "users.view"
  | "users.manage"
  | "permissions.manage"
  | "settings.view"
  | "settings.manage"
  | "backup.manage"
  | "approvals.manage"
  | "quotes.view"
  | "quotes.create"
  | "services.view"
  | "services.create"
  | "documents.print"
  | "notifications.view";

const ALL: Permission[] = [
  "dashboard.view",
  "sales.view",
  "sales.create",
  "sales.edit",
  "sales.cancel",
  "sales.print",
  "sales.export",
  "purchases.view",
  "purchases.create",
  "purchases.receive",
  "inventory.view",
  "inventory.create",
  "inventory.edit",
  "inventory.move",
  "inventory.adjust",
  "inventory.delete",
  "clients.view",
  "clients.create",
  "clients.edit",
  "suppliers.view",
  "suppliers.create",
  "suppliers.edit",
  "finance.view",
  "finance.create",
  "finance.pay",
  "cash.view",
  "cash.operate",
  "employees.view",
  "employees.manage",
  "reports.view",
  "reports.export",
  "audit.view",
  "users.view",
  "users.manage",
  "permissions.manage",
  "settings.view",
  "settings.manage",
  "backup.manage",
  "approvals.manage",
  "quotes.view",
  "quotes.create",
  "services.view",
  "services.create",
  "documents.print",
  "notifications.view",
];

const ROLE_PERMS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ALL,
  ADMIN: ALL.filter((p) => p !== "permissions.manage" || true),
  MANAGER: [
    "dashboard.view",
    "sales.view",
    "sales.create",
    "sales.print",
    "sales.export",
    "purchases.view",
    "purchases.create",
    "purchases.receive",
    "inventory.view",
    "inventory.create",
    "inventory.edit",
    "inventory.move",
    "clients.view",
    "clients.create",
    "clients.edit",
    "suppliers.view",
    "suppliers.create",
    "finance.view",
    "cash.view",
    "employees.view",
    "employees.manage",
    "reports.view",
    "reports.export",
    "quotes.view",
    "quotes.create",
    "services.view",
    "services.create",
    "documents.print",
    "notifications.view",
    "approvals.manage",
    "settings.view",
  ],
  FINANCE: [
    "dashboard.view",
    "sales.view",
    "sales.print",
    "finance.view",
    "finance.create",
    "finance.pay",
    "cash.view",
    "cash.operate",
    "clients.view",
    "suppliers.view",
    "reports.view",
    "reports.export",
    "documents.print",
    "notifications.view",
  ],
  SELLER: [
    "dashboard.view",
    "sales.view",
    "sales.create",
    "sales.print",
    "inventory.view",
    "clients.view",
    "clients.create",
    "quotes.view",
    "quotes.create",
    "cash.operate",
    "documents.print",
    "notifications.view",
    "reports.view",
  ],
  OPERATOR: [
    "dashboard.view",
    "sales.view",
    "sales.create",
    "sales.print",
    "inventory.view",
    "clients.view",
    "clients.create",
    "cash.operate",
    "documents.print",
    "notifications.view",
  ],
  WAREHOUSE: [
    "dashboard.view",
    "inventory.view",
    "inventory.create",
    "inventory.edit",
    "inventory.move",
    "inventory.adjust",
    "purchases.view",
    "purchases.receive",
    "suppliers.view",
    "notifications.view",
    "reports.view",
  ],
  TECHNICIAN: [
    "dashboard.view",
    "services.view",
    "services.create",
    "inventory.view",
    "clients.view",
    "notifications.view",
  ],
  AUDITOR: [
    "dashboard.view",
    "sales.view",
    "purchases.view",
    "inventory.view",
    "finance.view",
    "cash.view",
    "clients.view",
    "suppliers.view",
    "employees.view",
    "reports.view",
    "reports.export",
    "audit.view",
    "notifications.view",
  ],
};

export function normalizeRole(role: string | undefined | null): Role {
  const r = (role || "SELLER").toUpperCase();
  if (r === "OPERATOR") return "OPERATOR";
  if (r in ROLE_PERMS) return r as Role;
  if (r === "ADMIN") return "ADMIN";
  return "SELLER";
}

export function permissionsFor(role: string | undefined | null): Set<Permission> {
  const n = normalizeRole(role);
  return new Set(ROLE_PERMS[n] || ROLE_PERMS.SELLER);
}

export function can(
  role: string | undefined | null,
  permission: Permission,
  extra?: Permission[] | null
): boolean {
  const set = permissionsFor(role);
  if (extra?.length) extra.forEach((p) => set.add(p));
  // SUPER_ADMIN / ADMIN always full in practice
  const n = normalizeRole(role);
  if (n === "SUPER_ADMIN" || n === "ADMIN") return true;
  return set.has(permission);
}

export function isAdminLike(role: string | undefined | null): boolean {
  const n = normalizeRole(role);
  return n === "SUPER_ADMIN" || n === "ADMIN";
}

export function canSeeProfits(role: string | undefined | null): boolean {
  const n = normalizeRole(role);
  return (
    n === "SUPER_ADMIN" ||
    n === "ADMIN" ||
    n === "MANAGER" ||
    n === "FINANCE" ||
    n === "AUDITOR"
  );
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Administrador",
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  FINANCE: "Financeiro",
  SELLER: "Vendedor",
  WAREHOUSE: "Almoxarife",
  TECHNICIAN: "Técnico",
  AUDITOR: "Auditor",
  OPERATOR: "Operador",
};

export const ROLE_OPTIONS: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "FINANCE",
  "SELLER",
  "WAREHOUSE",
  "TECHNICIAN",
  "AUDITOR",
  "OPERATOR",
];
