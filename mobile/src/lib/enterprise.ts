/**
 * Enterprise modules — suppliers, purchases, payables, receivables,
 * services, quotes, notifications, document sequences, soft-delete helpers.
 * Extends the core Dexie DB (makina_offline_v3) with version 2 stores.
 */
import { db, logAudit, moneyShort } from "./db";
import { can, canSeeProfits, isAdminLike } from "./roles";

// ── Types ──────────────────────────────────────────────────────────

export type DocKind = "FAT" | "REC" | "ORC" | "OS" | "COM" | "ND";
export type QuoteStatus =
  | "DRAFT"
  | "SENT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "CONVERTED";
export type PayableStatus =
  | "PENDING"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";
export type ServiceStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_PARTS"
  | "DONE"
  | "CANCELLED";
export type PurchaseStatus =
  | "DRAFT"
  | "ORDERED"
  | "PARTIAL"
  | "RECEIVED"
  | "CANCELLED";
export type NotifLevel = "CRITICAL" | "ATTENTION" | "WARNING" | "INFO";

export interface Supplier {
  id?: number;
  code: string;
  name: string;
  company?: string | null;
  nif?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contact?: string | null;
  bank?: string | null;
  account?: string | null;
  notes?: string | null;
  active?: boolean;
  createdAt: number;
  deletedAt?: number | null;
}

export interface Purchase {
  id?: number;
  number: string;
  supplierId?: number | null;
  supplierName?: string | null;
  status: PurchaseStatus;
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  notes?: string | null;
  orderedAt?: number | null;
  receivedAt?: number | null;
  operatorId?: number | null;
  operatorName?: string | null;
  createdAt: number;
  deletedAt?: number | null;
}

export interface PurchaseItem {
  id?: number;
  purchaseId: number;
  partId?: number | null;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQty?: number;
}

export interface AccountPayable {
  id?: number;
  number: string;
  supplierId?: number | null;
  supplierName?: string | null;
  description: string;
  category?: string | null;
  amount: number;
  paidAmount: number;
  dueDate: number;
  status: PayableStatus;
  notes?: string | null;
  createdAt: number;
  paidAt?: number | null;
  deletedAt?: number | null;
}

export interface AccountReceivable {
  id?: number;
  number: string;
  clientId?: number | null;
  clientName?: string | null;
  saleId?: number | null;
  description: string;
  amount: number;
  receivedAmount: number;
  dueDate: number;
  status: PayableStatus;
  notes?: string | null;
  createdAt: number;
  receivedAt?: number | null;
  deletedAt?: number | null;
}

export interface Quote {
  id?: number;
  number: string;
  clientId?: number | null;
  clientName?: string | null;
  status: QuoteStatus;
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  validUntil?: number | null;
  notes?: string | null;
  operatorId?: number | null;
  convertedSaleId?: number | null;
  createdAt: number;
  deletedAt?: number | null;
}

export interface QuoteItem {
  id?: number;
  quoteId: number;
  partId?: number | null;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ServiceOrder {
  id?: number;
  number: string;
  clientId?: number | null;
  clientName?: string | null;
  title: string;
  description?: string | null;
  status: ServiceStatus;
  technicianId?: number | null;
  technicianName?: string | null;
  laborCost: number;
  partsCost: number;
  totalAmount: number;
  startedAt?: number | null;
  finishedAt?: number | null;
  notes?: string | null;
  createdAt: number;
  deletedAt?: number | null;
}

export interface AppNotification {
  id?: number;
  title: string;
  body: string;
  level: NotifLevel;
  module?: string | null;
  read: boolean;
  userId?: number | null; // null = all
  createdAt: number;
}

export interface DocSequence {
  id?: number;
  kind: DocKind;
  year: number;
  lastNumber: number;
}

export interface Category {
  id?: number;
  name: string;
  type: "PRODUCT" | "EXPENSE" | "SERVICE";
  createdAt: number;
}

export interface Brand {
  id?: number;
  name: string;
  createdAt: number;
}

// ── Schema bootstrap (idempotent tables via Dexie version bump in db.ts) ──

function code(prefix: string) {
  const r = Math.random().toString(36).substring(2, 6).toUpperCase();
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}-${d}-${r}`;
}

export async function nextDocNumber(kind: DocKind): Promise<string> {
  const year = new Date().getFullYear();
  try {
    const seqTable = db.docSequences;
    const rows = await seqTable.toArray();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let row = rows.find((r: any) => r.kind === kind && r.year === year) as
      | DocSequence
      | undefined;
    if (!row) {
      await seqTable.add({ kind, year, lastNumber: 1 } as never);
      return `${kind}-${year}-${String(1).padStart(6, "0")}`;
    }
    const next = (row.lastNumber || 0) + 1;
    await seqTable.update(row.id!, { lastNumber: next } as never);
    return `${kind}-${year}-${String(next).padStart(6, "0")}`;
  } catch {
    return `${kind}-${year}-${String(Date.now()).slice(-6)}`;
  }
}

// ── Notifications ──────────────────────────────────────────────────

export async function pushNotification(input: {
  title: string;
  body: string;
  level?: NotifLevel;
  module?: string;
  userId?: number | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).notifications;
  if (!t) return;
  await t.add({
    title: input.title,
    body: input.body,
    level: input.level || "INFO",
    module: input.module || null,
    read: false,
    userId: input.userId ?? null,
    createdAt: Date.now(),
  });
}

export async function listNotifications(userId?: number, limit = 50) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).notifications;
  if (!t) return [] as AppNotification[];
  const all: AppNotification[] = await t.orderBy("createdAt").reverse().limit(200).toArray();
  return all
    .filter((n) => n.userId == null || n.userId === userId)
    .slice(0, limit);
}

export async function markNotificationRead(id: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).notifications;
  if (!t) return;
  await t.update(id, { read: true });
}

export async function markAllNotificationsRead(userId?: number) {
  const list = await listNotifications(userId, 500);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).notifications;
  if (!t) return;
  for (const n of list) {
    if (!n.read && n.id) await t.update(n.id, { read: true });
  }
}

// ── Suppliers ──────────────────────────────────────────────────────

export async function listSuppliers(q = "") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).suppliers;
  if (!t) return [] as Supplier[];
  const all: Supplier[] = await t.orderBy("createdAt").reverse().toArray();
  const active = all.filter((s) => !s.deletedAt);
  if (!q.trim()) return active;
  const s = q.toLowerCase();
  return active.filter(
    (x) =>
      x.name.toLowerCase().includes(s) ||
      (x.nif && x.nif.includes(s)) ||
      (x.phone && x.phone.includes(s)) ||
      x.code.toLowerCase().includes(s)
  );
}

export async function addSupplier(
  input: Omit<Supplier, "id" | "code" | "createdAt" | "deletedAt" | "active">,
  user?: { id: number; name: string; role: string }
) {
  if (user && !can(user.role, "suppliers.create"))
    throw new Error("Sem permissão para criar fornecedores.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).suppliers;
  if (!t) throw new Error("Módulo fornecedores indisponível.");
  const codeStr = code("FOR");
  const id = await t.add({
    ...input,
    code: codeStr,
    name: input.name.trim(),
    active: true,
    createdAt: Date.now(),
    deletedAt: null,
  });
  await logAudit("SUPPLIER_ADD", `${input.name} (${codeStr})`, user);
  await pushNotification({
    title: "Novo fornecedor",
    body: input.name,
    level: "INFO",
    module: "suppliers",
  });
  return id;
}

// ── Purchases ──────────────────────────────────────────────────────

export async function listPurchases() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).purchases;
  if (!t) return [] as Purchase[];
  const all: Purchase[] = await t.orderBy("createdAt").reverse().toArray();
  return all.filter((p) => !p.deletedAt);
}

export async function createPurchase(
  input: {
    supplierId?: number | null;
    supplierName?: string | null;
    items: { partId?: number | null; name: string; quantity: number; unitCost: number }[];
    discount?: number;
    taxRate?: number;
    notes?: string | null;
    receiveNow?: boolean;
  },
  user: { id: number; name: string; role: string }
) {
  if (!can(user.role, "purchases.create"))
    throw new Error("Sem permissão para criar compras.");
  if (!input.items?.length) throw new Error("Adicione itens à compra.");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const purchases = (db as any).purchases;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const purchaseItems = (db as any).purchaseItems;
  if (!purchases || !purchaseItems) throw new Error("Módulo compras indisponível.");

  let subtotal = 0;
  for (const it of input.items) {
    subtotal += Number(it.quantity) * Number(it.unitCost);
  }
  const discount = Math.min(Number(input.discount || 0), subtotal);
  const after = Math.max(0, subtotal - discount);
  const tax = (after * Number(input.taxRate || 0)) / 100;
  const total = Math.round((after + tax) * 100) / 100;
  const number = await nextDocNumber("COM");
  const now = Date.now();

  const purchaseId = await db.transaction(
    "rw",
    db.tables,
    async () => {
      const id = await purchases.add({
        number,
        supplierId: input.supplierId ?? null,
        supplierName: input.supplierName ?? null,
        status: input.receiveNow ? "RECEIVED" : "ORDERED",
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(tax * 100) / 100,
        discount,
        totalAmount: total,
        notes: input.notes ?? null,
        orderedAt: now,
        receivedAt: input.receiveNow ? now : null,
        operatorId: user.id,
        operatorName: user.name,
        createdAt: now,
        deletedAt: null,
      });

      for (const it of input.items) {
        await purchaseItems.add({
          purchaseId: id,
          partId: it.partId ?? null,
          name: it.name,
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost),
          totalCost: Number(it.quantity) * Number(it.unitCost),
          receivedQty: input.receiveNow ? Number(it.quantity) : 0,
        });

        if (input.receiveNow && it.partId) {
          const part = await db.parts.get(it.partId);
          if (part) {
            const prev = Number(part.stock) || 0;
            const qty = Number(it.quantity);
            const newStock = prev + qty;
            await db.parts.update(it.partId, {
              stock: newStock,
              cost: Number(it.unitCost),
              updatedAt: now,
            });
            await db.stockMovements.add({
              partId: it.partId,
              partName: part.name,
              type: "IN",
              quantity: qty,
              previousStock: prev,
              newStock,
              reason: `Compra ${number}`,
              operatorId: user.id,
              createdAt: now,
            });
          }
        }
      }

      // Auto payable
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payables = (db as any).accountsPayable;
      if (payables) {
        const pnum = await nextDocNumber("COM");
        await payables.add({
          number: pnum.replace("COM", "CP"),
          supplierId: input.supplierId ?? null,
          supplierName: input.supplierName ?? null,
          description: `Compra ${number}`,
          category: "PURCHASE",
          amount: total,
          paidAmount: 0,
          dueDate: now + 7 * 86400000,
          status: "PENDING",
          notes: null,
          createdAt: now,
          paidAt: null,
          deletedAt: null,
        });
      }

      return id;
    }
  );

  await logAudit("PURCHASE_CREATE", number, user);
  await pushNotification({
    title: "Nova compra",
    body: `${number} · ${moneyShort(total)}`,
    level: "INFO",
    module: "purchases",
  });
  return { purchaseId, number, total };
}

export async function receivePurchase(
  purchaseId: number,
  user: { id: number; name: string; role: string }
) {
  if (!can(user.role, "purchases.receive"))
    throw new Error("Sem permissão para receber compras.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const purchases = (db as any).purchases;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const purchaseItems = (db as any).purchaseItems;
  const p: Purchase = await purchases.get(purchaseId);
  if (!p || p.status === "RECEIVED") throw new Error("Compra inválida.");
  const items: PurchaseItem[] = await purchaseItems
    .where("purchaseId")
    .equals(purchaseId)
    .toArray();
  const now = Date.now();

  await db.transaction("rw", db.tables, async () => {
    for (const it of items) {
      if (!it.partId) continue;
      const part = await db.parts.get(it.partId);
      if (!part) continue;
      const prev = Number(part.stock) || 0;
      const qty = Number(it.quantity) - Number(it.receivedQty || 0);
      if (qty <= 0) continue;
      const newStock = prev + qty;
      await db.parts.update(it.partId, { stock: newStock, updatedAt: now });
      await db.stockMovements.add({
        partId: it.partId,
        partName: part.name,
        type: "IN",
        quantity: qty,
        previousStock: prev,
        newStock,
        reason: `Receção ${p.number}`,
        operatorId: user.id,
        createdAt: now,
      });
      await purchaseItems.update(it.id!, { receivedQty: it.quantity });
    }
    await purchases.update(purchaseId, {
      status: "RECEIVED",
      receivedAt: now,
    });
  });
  await logAudit("PURCHASE_RECEIVE", p.number, user);
}

// ── Payables / Receivables ─────────────────────────────────────────

export async function listPayables() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).accountsPayable;
  if (!t) return [] as AccountPayable[];
  const all: AccountPayable[] = await t.orderBy("dueDate").toArray();
  const now = Date.now();
  // auto-mark overdue
  for (const a of all) {
    if (
      a.status === "PENDING" ||
      a.status === "PARTIAL"
    ) {
      if (a.dueDate < now && a.paidAmount < a.amount) {
        // soft update status for display
        a.status = "OVERDUE";
      }
    }
  }
  return all.filter((a) => !a.deletedAt);
}

export async function addPayable(
  input: {
    supplierId?: number | null;
    supplierName?: string | null;
    description: string;
    category?: string;
    amount: number;
    dueDate: number;
    notes?: string;
  },
  user: { id: number; name: string; role: string }
) {
  if (!can(user.role, "finance.create"))
    throw new Error("Sem permissão financeira.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).accountsPayable;
  if (!t) throw new Error("Módulo contas a pagar indisponível.");
  const number = code("CP");
  const id = await t.add({
    number,
    supplierId: input.supplierId ?? null,
    supplierName: input.supplierName ?? null,
    description: input.description.trim(),
    category: input.category || "OTHER",
    amount: Number(input.amount),
    paidAmount: 0,
    dueDate: input.dueDate,
    status: "PENDING",
    notes: input.notes || null,
    createdAt: Date.now(),
    paidAt: null,
    deletedAt: null,
  });
  await logAudit("PAYABLE_ADD", input.description, user);
  return id;
}

export async function payPayable(
  id: number,
  amount: number,
  user: { id: number; name: string; role: string }
) {
  if (!can(user.role, "finance.pay"))
    throw new Error("Sem permissão para pagar.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).accountsPayable;
  const row: AccountPayable = await t.get(id);
  if (!row) throw new Error("Conta não encontrada");
  const paid = Number(row.paidAmount) + Number(amount);
  let status: PayableStatus = "PARTIAL";
  if (paid + 0.01 >= row.amount) status = "PAID";
  await t.update(id, {
    paidAmount: Math.min(paid, row.amount),
    status,
    paidAt: status === "PAID" ? Date.now() : row.paidAt,
  });
  await logAudit("PAYABLE_PAY", `${row.number} +${amount}`, user);
}

export async function listReceivables() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).accountsReceivable;
  if (!t) return [] as AccountReceivable[];
  const all: AccountReceivable[] = await t.orderBy("dueDate").toArray();
  const now = Date.now();
  for (const a of all) {
    if (
      (a.status === "PENDING" || a.status === "PARTIAL") &&
      a.dueDate < now &&
      a.receivedAmount < a.amount
    ) {
      a.status = "OVERDUE";
    }
  }
  return all.filter((a) => !a.deletedAt);
}

export async function addReceivable(
  input: {
    clientId?: number | null;
    clientName?: string | null;
    saleId?: number | null;
    description: string;
    amount: number;
    dueDate: number;
  },
  user?: { id: number; name: string; role: string }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).accountsReceivable;
  if (!t) return null;
  const number = code("CR");
  return t.add({
    number,
    clientId: input.clientId ?? null,
    clientName: input.clientName ?? null,
    saleId: input.saleId ?? null,
    description: input.description,
    amount: Number(input.amount),
    receivedAmount: 0,
    dueDate: input.dueDate,
    status: "PENDING",
    notes: null,
    createdAt: Date.now(),
    receivedAt: null,
    deletedAt: null,
  });
}

export async function receiveReceivable(
  id: number,
  amount: number,
  user: { id: number; name: string; role: string }
) {
  if (!can(user.role, "finance.pay"))
    throw new Error("Sem permissão.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).accountsReceivable;
  const row: AccountReceivable = await t.get(id);
  if (!row) throw new Error("Conta não encontrada");
  const rec = Number(row.receivedAmount) + Number(amount);
  let status: PayableStatus = "PARTIAL";
  if (rec + 0.01 >= row.amount) status = "PAID";
  await t.update(id, {
    receivedAmount: Math.min(rec, row.amount),
    status,
    receivedAt: status === "PAID" ? Date.now() : row.receivedAt,
  });
  await logAudit("RECEIVABLE_PAY", `${row.number} +${amount}`, user);
}

// ── Quotes ─────────────────────────────────────────────────────────

export async function listQuotes() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).quotes;
  if (!t) return [] as Quote[];
  const all: Quote[] = await t.orderBy("createdAt").reverse().toArray();
  return all.filter((q) => !q.deletedAt);
}

export async function createQuote(
  input: {
    clientId?: number | null;
    clientName?: string | null;
    items: { partId?: number | null; name: string; quantity: number; unitPrice: number }[];
    discount?: number;
    taxRate?: number;
    validDays?: number;
    notes?: string;
  },
  user: { id: number; name: string; role: string }
) {
  if (!can(user.role, "quotes.create"))
    throw new Error("Sem permissão para orçamentos.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quotes = (db as any).quotes;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quoteItems = (db as any).quoteItems;
  if (!quotes) throw new Error("Módulo orçamentos indisponível.");

  let subtotal = 0;
  for (const it of input.items) subtotal += it.quantity * it.unitPrice;
  const discount = Math.min(Number(input.discount || 0), subtotal);
  const after = Math.max(0, subtotal - discount);
  const tax = (after * Number(input.taxRate || 0)) / 100;
  const total = Math.round((after + tax) * 100) / 100;
  const number = await nextDocNumber("ORC");
  const now = Date.now();
  const id = await quotes.add({
    number,
    clientId: input.clientId ?? null,
    clientName: input.clientName ?? null,
    status: "DRAFT",
    subtotal,
    discount,
    taxAmount: tax,
    totalAmount: total,
    validUntil: now + (input.validDays || 15) * 86400000,
    notes: input.notes || null,
    operatorId: user.id,
    convertedSaleId: null,
    createdAt: now,
    deletedAt: null,
  });
  if (quoteItems) {
    for (const it of input.items) {
      await quoteItems.add({
        quoteId: id,
        partId: it.partId ?? null,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.quantity * it.unitPrice,
      });
    }
  }
  await logAudit("QUOTE_CREATE", number, user);
  return { id, number, total };
}

export async function setQuoteStatus(
  id: number,
  status: QuoteStatus,
  user: { id: number; name: string; role: string }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).quotes;
  await t.update(id, { status });
  await logAudit("QUOTE_STATUS", `${id} → ${status}`, user);
}

// ── Services ───────────────────────────────────────────────────────

export async function listServices() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).serviceOrders;
  if (!t) return [] as ServiceOrder[];
  const all: ServiceOrder[] = await t.orderBy("createdAt").reverse().toArray();
  return all.filter((s) => !s.deletedAt);
}

export async function createService(
  input: {
    clientId?: number | null;
    clientName?: string | null;
    title: string;
    description?: string;
    technicianId?: number | null;
    technicianName?: string | null;
    laborCost?: number;
    partsCost?: number;
    notes?: string;
  },
  user: { id: number; name: string; role: string }
) {
  if (!can(user.role, "services.create"))
    throw new Error("Sem permissão para serviços.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).serviceOrders;
  if (!t) throw new Error("Módulo serviços indisponível.");
  const number = await nextDocNumber("OS");
  const labor = Number(input.laborCost || 0);
  const parts = Number(input.partsCost || 0);
  const id = await t.add({
    number,
    clientId: input.clientId ?? null,
    clientName: input.clientName ?? null,
    title: input.title.trim(),
    description: input.description || null,
    status: "OPEN",
    technicianId: input.technicianId ?? null,
    technicianName: input.technicianName ?? null,
    laborCost: labor,
    partsCost: parts,
    totalAmount: labor + parts,
    startedAt: null,
    finishedAt: null,
    notes: input.notes || null,
    createdAt: Date.now(),
    deletedAt: null,
  });
  await logAudit("SERVICE_CREATE", number, user);
  return { id, number };
}

export async function updateServiceStatus(
  id: number,
  status: ServiceStatus,
  user: { id: number; name: string; role: string }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).serviceOrders;
  const patch: Partial<ServiceOrder> = { status };
  if (status === "IN_PROGRESS") patch.startedAt = Date.now();
  if (status === "DONE") patch.finishedAt = Date.now();
  await t.update(id, patch);
  await logAudit("SERVICE_STATUS", `${id} → ${status}`, user);
}

// ── Enterprise dashboard KPIs ──────────────────────────────────────

export async function getEnterpriseKpis(role: string, userId: number) {
  const seeProfit = canSeeProfits(role);
  const admin = isAdminLike(role);

  const parts = await db.parts.toArray();
  let sales = await db.sales.where("status").equals("COMPLETED").toArray();
  if (!admin && !can(role, "sales.view")) sales = [];
  else if (!admin && !seeProfit && can(role, "sales.create")) {
    // sellers see own sales
    sales = sales.filter((s) => s.operatorId === userId);
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const daySales = sales.filter((s) => s.createdAt >= startOfDay.getTime());
  const monthSales = sales.filter((s) => s.createdAt >= startOfMonth.getTime());

  const dayRevenue = daySales.reduce((a, s) => a + Number(s.totalAmount), 0);
  const monthRevenue = monthSales.reduce((a, s) => a + Number(s.totalAmount), 0);
  const profit = seeProfit
    ? sales.reduce((a, s) => a + Number(s.profit), 0)
    : 0;
  const expenses = seeProfit
    ? (await db.expenses.toArray()).reduce((a, e) => a + Number(e.amount), 0)
    : 0;

  const threshold = 5;
  const lowStock = parts.filter((p) => Number(p.stock) <= Number(p.minStock ?? threshold));
  const clients = await db.clients.count();
  const suppliers = await listSuppliers();
  const payables = await listPayables();
  const receivables = await listReceivables();
  const overduePay = payables.filter((p) => p.status === "OVERDUE");
  const overdueRec = receivables.filter((r) => r.status === "OVERDUE");
  const dueSoon = [...payables, ...receivables].filter((x) => {
    const due = "dueDate" in x ? x.dueDate : 0;
    return due > Date.now() && due < Date.now() + 7 * 86400000;
  });

  const openCash = await db.cashSessions
    .filter((c) => c.status === "OPEN")
    .toArray();

  const users = await db.users.filter((u) => u.active !== false).count();
  const notifs = await listNotifications(userId, 20);
  const unread = notifs.filter((n) => !n.read).length;

  return {
    dayRevenue,
    monthRevenue,
    profit,
    netProfit: seeProfit ? profit - expenses : 0,
    expenses,
    salesCount: sales.length,
    daySales: daySales.length,
    monthSales: monthSales.length,
    stockUnits: parts.reduce((a, p) => a + Number(p.stock), 0),
    stockSkus: parts.length,
    lowStock,
    clients,
    suppliers: suppliers.length,
    overduePayables: overduePay.length,
    overdueReceivables: overdueRec.length,
    dueSoon: dueSoon.length,
    openCashSessions: openCash.length,
    activeUsers: users,
    unreadNotifications: unread,
    seeProfit,
  };
}

// Re-export helpers used by pages
export { can, canSeeProfits, isAdminLike, moneyShort };
