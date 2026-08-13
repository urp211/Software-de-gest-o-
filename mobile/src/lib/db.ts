import Dexie, { type Table } from "dexie";
import bcrypt from "bcryptjs";

export type Role = "ADMIN" | "OPERATOR";
export type PartCondition = "NEW" | "USED";
export type SaleStatus = "COMPLETED" | "CANCELLED";
export type PaymentMethod = "CASH" | "TRANSFER" | "CARD" | "MULTICAIXA" | "MIXED";
export type ExpenseCategory =
  | "RENT"
  | "SALARY"
  | "UTILITIES"
  | "SUPPLIES"
  | "TRANSPORT"
  | "TAX"
  | "MAINTENANCE"
  | "OTHER";

export interface User {
  id?: number;
  username: string;
  password: string;
  role: Role;
  name: string;
  photoUrl?: string | null;
  autoLogoutTime?: number | null;
  active?: boolean;
  phone?: string | null;
  createdAt: number;
}

export interface Settings {
  id?: number;
  companyName: string;
  nif: string;
  address: string;
  phone?: string;
  email?: string;
  logoDataUrl?: string | null;
  thermalWidth?: number; // mm: 58 or 80
  currency?: string;
  taxRate?: number; // percent IVA default
  invoiceFooter?: string;
  allowOperatorSecondCopy?: boolean;
  lowStockThreshold?: number;
}

export interface Warehouse {
  id?: number;
  name: string;
  location?: string | null;
}

export interface Part {
  id?: number;
  trackingCode: string;
  name: string;
  description?: string | null;
  condition: PartCondition;
  price: number;
  cost: number;
  stock: number;
  minStock?: number;
  warehouseId?: number | null;
  imageUrl?: string | null;
  barcode?: string | null;
  category?: string | null;
  brand?: string | null;
  createdAt: number;
  updatedAt?: number;
}

export interface Sale {
  id?: number;
  invoiceNumber: string;
  clientId?: number | null;
  clientName?: string | null;
  clientNif?: string | null;
  operatorId?: number | null;
  operatorName?: string | null;
  totalAmount: number;
  subtotal?: number;
  taxAmount?: number;
  discount?: number;
  costTotal?: number;
  profit: number;
  amountPaid?: number;
  changeGiven?: number;
  paymentMethod?: PaymentMethod;
  status: SaleStatus;
  notes?: string | null;
  reprintCount?: number;
  qrPayload?: string | null;
  createdAt: number;
  cancelledAt?: number | null;
  cancelledBy?: number | null;
  cancelReason?: string | null;
}

export interface SaleItem {
  id?: number;
  saleId: number;
  partId: number;
  partName?: string;
  trackingCode?: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  totalPrice: number;
}

export interface Announcement {
  id?: number;
  message: string;
  adminId?: number | null;
  createdAt: number;
}

export interface Client {
  id?: number;
  name: string;
  nif?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: number;
}

export interface Expense {
  id?: number;
  category: ExpenseCategory;
  description: string;
  amount: number;
  operatorId?: number | null;
  date: number;
  createdAt: number;
}

export interface CashSession {
  id?: number;
  operatorId: number;
  operatorName?: string;
  openedAt: number;
  closedAt?: number | null;
  openingFloat: number;
  closingCash?: number | null;
  expectedCash?: number | null;
  difference?: number | null;
  notes?: string | null;
  status: "OPEN" | "CLOSED";
}

export interface StockMovement {
  id?: number;
  partId: number;
  partName?: string;
  type: "IN" | "OUT" | "ADJUST" | "SALE" | "RETURN";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string | null;
  operatorId?: number | null;
  createdAt: number;
}

export interface AuditLog {
  id?: number;
  userId?: number | null;
  userName?: string | null;
  action: string;
  details?: string | null;
  createdAt: number;
}

export interface SecondCopyRequest {
  id?: number;
  saleId: number;
  invoiceNumber: string;
  requestedBy: number;
  requestedByName?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminId?: number | null;
  reason?: string | null;
  createdAt: number;
  resolvedAt?: number | null;
}

class MakinaDB extends Dexie {
  users!: Table<User, number>;
  settings!: Table<Settings, number>;
  warehouses!: Table<Warehouse, number>;
  parts!: Table<Part, number>;
  sales!: Table<Sale, number>;
  saleItems!: Table<SaleItem, number>;
  announcements!: Table<Announcement, number>;
  clients!: Table<Client, number>;
  expenses!: Table<Expense, number>;
  cashSessions!: Table<CashSession, number>;
  stockMovements!: Table<StockMovement, number>;
  auditLogs!: Table<AuditLog, number>;
  secondCopyRequests!: Table<SecondCopyRequest, number>;

  constructor() {
    super("makina_offline_v2");
    this.version(1).stores({
      users: "++id, username, role, createdAt, active",
      settings: "++id",
      warehouses: "++id, name",
      parts: "++id, trackingCode, name, warehouseId, createdAt, stock, category",
      sales: "++id, invoiceNumber, operatorId, status, createdAt, clientId, paymentMethod",
      saleItems: "++id, saleId, partId",
      announcements: "++id, createdAt",
      clients: "++id, name, nif, phone, createdAt",
      expenses: "++id, category, date, createdAt, operatorId",
      cashSessions: "++id, operatorId, status, openedAt",
      stockMovements: "++id, partId, type, createdAt, operatorId",
      auditLogs: "++id, userId, action, createdAt",
      secondCopyRequests: "++id, saleId, status, requestedBy, createdAt",
    });
  }
}

export const db = new MakinaDB();

function code(prefix: string) {
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}-${dateStr}-${randomStr}`;
}

export async function logAudit(
  action: string,
  details?: string,
  user?: { id?: number; name?: string } | null
) {
  await db.auditLogs.add({
    userId: user?.id ?? null,
    userName: user?.name ?? null,
    action,
    details: details ?? null,
    createdAt: Date.now(),
  });
}

export async function seedIfNeeded() {
  const admin = await db.users.where("username").equals("MAKINA").first();
  if (!admin) {
    await db.users.add({
      username: "MAKINA",
      password: await bcrypt.hash("admmakina", 10),
      role: "ADMIN",
      name: "Administrador Geral",
      active: true,
      createdAt: Date.now(),
    });
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      companyName: "MAKINA Company",
      nif: "000000000",
      address: "Luanda, Angola",
      phone: "",
      email: "",
      thermalWidth: 58,
      currency: "AOA",
      taxRate: 0,
      invoiceFooter: "Obrigado pela preferência · AGT Angola",
      allowOperatorSecondCopy: false,
      lowStockThreshold: 5,
    });
  }

  const whCount = await db.warehouses.count();
  if (whCount === 0) {
    await db.warehouses.add({ name: "Armazém Principal", location: "Sede" });
  }
}

export async function login(username: string, password: string) {
  await seedIfNeeded();
  const user = await db.users.where("username").equals(username.trim()).first();
  if (!user) return null;
  if (user.active === false) return null;
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;
  await logAudit("LOGIN", `Sessão iniciada`, { id: user.id, name: user.name });
  return {
    id: user.id!,
    username: user.username,
    name: user.name,
    role: user.role,
    autoLogoutTime: user.autoLogoutTime ?? null,
  };
}

export async function getSettings(): Promise<Settings> {
  return (
    (await db.settings.toCollection().first()) ?? {
      companyName: "MAKINA Company",
      nif: "000000000",
      address: "Luanda, Angola",
      thermalWidth: 58,
      taxRate: 0,
      lowStockThreshold: 5,
      allowOperatorSecondCopy: false,
      invoiceFooter: "Obrigado pela preferência",
    }
  );
}

export async function updateSettings(patch: Partial<Settings>) {
  const current = await db.settings.toCollection().first();
  if (!current?.id) {
    await db.settings.add({
      companyName: patch.companyName || "MAKINA Company",
      nif: patch.nif || "000000000",
      address: patch.address || "Luanda, Angola",
      ...patch,
    } as Settings);
    return;
  }
  await db.settings.update(current.id, patch);
}

/** Dashboard — operators only see own sales, never global profit */
export async function getDashboardStats(opts?: {
  role?: Role;
  userId?: number;
}) {
  const isAdmin = opts?.role === "ADMIN";
  const parts = await db.parts.toArray();
  let sales = await db.sales.where("status").equals("COMPLETED").toArray();
  if (!isAdmin && opts?.userId) {
    sales = sales.filter((s) => s.operatorId === opts.userId);
  }

  const totalParts = parts.length;
  const totalUnits = parts.reduce((a, p) => a + p.stock, 0);
  const stockValue = isAdmin
    ? parts.reduce((a, p) => a + p.price * p.stock, 0)
    : 0;
  const stockCost = isAdmin
    ? parts.reduce((a, p) => a + p.cost * p.stock, 0)
    : 0;
  const revenue = sales.reduce((a, s) => a + s.totalAmount, 0);
  const profit = isAdmin ? sales.reduce((a, s) => a + s.profit, 0) : 0;
  const expenses = isAdmin
    ? (await db.expenses.toArray()).reduce((a, e) => a + e.amount, 0)
    : 0;
  const threshold = (await getSettings()).lowStockThreshold ?? 5;
  const lowStock = parts.filter((p) => p.stock <= (p.minStock ?? threshold));
  const announcements = await db.announcements
    .orderBy("createdAt")
    .reverse()
    .limit(5)
    .toArray();

  // Today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todaySales = sales.filter((s) => s.createdAt >= startOfDay.getTime());
  const todayRevenue = todaySales.reduce((a, s) => a + s.totalAmount, 0);
  const todayProfit = isAdmin
    ? todaySales.reduce((a, s) => a + s.profit, 0)
    : 0;

  return {
    totalParts,
    totalUnits,
    stockValue,
    stockCost,
    revenue,
    profit,
    netProfit: isAdmin ? profit - expenses : 0,
    expenses,
    salesCount: sales.length,
    todaySales: todaySales.length,
    todayRevenue,
    todayProfit,
    lowStock,
    announcements,
    isAdmin,
  };
}

export async function listParts(query = "") {
  const all = await db.parts.orderBy("createdAt").reverse().toArray();
  const warehouses = await db.warehouses.toArray();
  const whMap = new Map(warehouses.map((w) => [w.id!, w]));
  const q = query.trim().toLowerCase();
  const filtered = q
    ? all.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.trackingCode.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      )
    : all;
  return filtered.map((p) => ({
    ...p,
    warehouseName: p.warehouseId
      ? whMap.get(p.warehouseId)?.name ?? "—"
      : "Sem armazém",
  }));
}

export async function addPart(
  input: {
    name: string;
    description?: string;
    condition: PartCondition;
    price: number;
    cost: number;
    stock: number;
    minStock?: number;
    warehouseId?: number | null;
    imageUrl?: string | null;
    barcode?: string | null;
    category?: string | null;
    brand?: string | null;
  },
  operator?: { id: number; name: string; role: Role }
) {
  if (operator && operator.role !== "ADMIN") {
    throw new Error("Apenas administradores podem adicionar peças ao estoque.");
  }
  const trackingCode = code("MAK");
  const id = await db.parts.add({
    trackingCode,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    condition: input.condition,
    price: Number(input.price),
    cost: Number(input.cost),
    stock: Number(input.stock),
    minStock: input.minStock ?? 5,
    warehouseId: input.warehouseId ?? null,
    imageUrl: input.imageUrl ?? null,
    barcode: input.barcode ?? null,
    category: input.category ?? null,
    brand: input.brand ?? null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  await db.stockMovements.add({
    partId: id,
    partName: input.name.trim(),
    type: "IN",
    quantity: Number(input.stock),
    previousStock: 0,
    newStock: Number(input.stock),
    reason: "Entrada inicial",
    operatorId: operator?.id ?? null,
    createdAt: Date.now(),
  });
  await logAudit("PART_ADD", `${input.name} (${trackingCode})`, operator);
  return { id, trackingCode };
}

export async function updatePart(
  id: number,
  patch: Partial<Part>,
  operator?: { id: number; name: string; role: Role }
) {
  if (operator && operator.role !== "ADMIN") {
    throw new Error("Apenas administradores podem editar peças.");
  }
  await db.parts.update(id, { ...patch, updatedAt: Date.now() });
  await logAudit("PART_EDIT", `Peça #${id}`, operator);
}

export async function adjustStock(
  partId: number,
  newStock: number,
  reason: string,
  operator?: { id: number; name: string; role: Role }
) {
  if (operator && operator.role !== "ADMIN") {
    throw new Error("Apenas administradores podem ajustar stock.");
  }
  const part = await db.parts.get(partId);
  if (!part) throw new Error("Peça não encontrada");
  const prev = part.stock;
  await db.parts.update(partId, { stock: newStock, updatedAt: Date.now() });
  await db.stockMovements.add({
    partId,
    partName: part.name,
    type: "ADJUST",
    quantity: newStock - prev,
    previousStock: prev,
    newStock,
    reason,
    operatorId: operator?.id ?? null,
    createdAt: Date.now(),
  });
  await logAudit("STOCK_ADJUST", `${part.name}: ${prev} → ${newStock}`, operator);
}

export async function listSales(opts?: { role?: Role; userId?: number }) {
  let sales = await db.sales.orderBy("createdAt").reverse().toArray();
  if (opts?.role === "OPERATOR" && opts.userId) {
    sales = sales.filter((s) => s.operatorId === opts.userId);
  }
  return sales;
}

export async function getSaleFull(saleId: number) {
  const sale = await db.sales.get(saleId);
  if (!sale) return null;
  const items = await db.saleItems.where("saleId").equals(saleId).toArray();
  const settings = await getSettings();
  const operator = sale.operatorId
    ? await db.users.get(sale.operatorId)
    : null;
  return { sale, items, settings, operator };
}

export async function createSale(
  input: {
    items: {
      id: number;
      name?: string;
      trackingCode?: string;
      price: number;
      cost: number;
      quantity: number;
    }[];
    operatorId: number;
    operatorName?: string;
    clientId?: number | null;
    clientName?: string | null;
    clientNif?: string | null;
    paymentMethod?: PaymentMethod;
    amountPaid?: number;
    discount?: number;
    taxRate?: number;
    notes?: string | null;
  }
) {
  if (!input.items.length) throw new Error("Carrinho vazio");

  return db.transaction(
    "rw",
    db.parts,
    db.sales,
    db.saleItems,
    db.stockMovements,
    db.auditLogs,
    async () => {
      for (const item of input.items) {
        const part = await db.parts.get(item.id);
        if (!part) throw new Error("Peça não encontrada");
        if (part.stock < item.quantity)
          throw new Error(`Stock insuficiente: ${part.name}`);
      }

      const discount = Number(input.discount || 0);
      let subtotal = 0;
      let totalCost = 0;
      for (const item of input.items) {
        subtotal += item.price * item.quantity;
        totalCost += item.cost * item.quantity;
      }
      const afterDiscount = Math.max(0, subtotal - discount);
      const taxRate = Number(input.taxRate ?? 0);
      const taxAmount = (afterDiscount * taxRate) / 100;
      const totalAmount = afterDiscount + taxAmount;
      const profit = afterDiscount - totalCost;
      const amountPaid =
        input.amountPaid != null ? Number(input.amountPaid) : totalAmount;
      if (amountPaid + 0.001 < totalAmount) {
        throw new Error("Valor entregue inferior ao total da fatura.");
      }
      const changeGiven = Math.max(0, amountPaid - totalAmount);
      const invoiceNumber = code("MAK-INV");
      const createdAt = Date.now();
      const qrPayload = JSON.stringify({
        inv: invoiceNumber,
        nif: (await getSettings()).nif,
        total: totalAmount,
        date: new Date(createdAt).toISOString(),
        op: input.operatorName || input.operatorId,
      });

      const saleId = await db.sales.add({
        invoiceNumber,
        clientId: input.clientId ?? null,
        clientName: input.clientName ?? null,
        clientNif: input.clientNif ?? null,
        operatorId: input.operatorId,
        operatorName: input.operatorName ?? null,
        totalAmount,
        subtotal,
        taxAmount,
        discount,
        costTotal: totalCost,
        profit,
        amountPaid,
        changeGiven,
        paymentMethod: input.paymentMethod || "CASH",
        status: "COMPLETED",
        notes: input.notes ?? null,
        reprintCount: 0,
        qrPayload,
        createdAt,
      });

      for (const item of input.items) {
        const part = await db.parts.get(item.id);
        await db.saleItems.add({
          saleId,
          partId: item.id,
          partName: item.name || part?.name,
          trackingCode: item.trackingCode || part?.trackingCode,
          quantity: item.quantity,
          unitPrice: item.price,
          unitCost: item.cost,
          totalPrice: item.price * item.quantity,
        });
        if (part) {
          const newStock = part.stock - item.quantity;
          await db.parts.update(item.id, {
            stock: newStock,
            updatedAt: Date.now(),
          });
          await db.stockMovements.add({
            partId: item.id,
            partName: part.name,
            type: "SALE",
            quantity: -item.quantity,
            previousStock: part.stock,
            newStock,
            reason: invoiceNumber,
            operatorId: input.operatorId,
            createdAt,
          });
        }
      }

      await logAudit(
        "SALE",
        `${invoiceNumber} · ${totalAmount} Kz`,
        { id: input.operatorId, name: input.operatorName }
      );

      return {
        saleId,
        invoiceNumber,
        totalAmount,
        profit,
        changeGiven,
        amountPaid,
        subtotal,
        taxAmount,
        discount,
        qrPayload,
      };
    }
  );
}

export async function cancelSale(
  saleId: number,
  admin: { id: number; name: string; role: Role },
  reason: string
) {
  if (admin.role !== "ADMIN") throw new Error("Apenas admin pode anular faturas.");
  const sale = await db.sales.get(saleId);
  if (!sale || sale.status !== "COMPLETED")
    throw new Error("Venda inválida para anulação.");

  return db.transaction(
    "rw",
    db.sales,
    db.saleItems,
    db.parts,
    db.stockMovements,
    db.auditLogs,
    async () => {
      const items = await db.saleItems.where("saleId").equals(saleId).toArray();
      for (const it of items) {
        const part = await db.parts.get(it.partId);
        if (part) {
          const newStock = part.stock + it.quantity;
          await db.parts.update(part.id!, {
            stock: newStock,
            updatedAt: Date.now(),
          });
          await db.stockMovements.add({
            partId: part.id!,
            partName: part.name,
            type: "RETURN",
            quantity: it.quantity,
            previousStock: part.stock,
            newStock,
            reason: `Anulação ${sale.invoiceNumber}`,
            operatorId: admin.id,
            createdAt: Date.now(),
          });
        }
      }
      await db.sales.update(saleId, {
        status: "CANCELLED",
        cancelledAt: Date.now(),
        cancelledBy: admin.id,
        cancelReason: reason,
      });
      await logAudit(
        "SALE_CANCEL",
        `${sale.invoiceNumber}: ${reason}`,
        admin
      );
    }
  );
}

export async function requestSecondCopy(
  saleId: number,
  user: { id: number; name: string; role: Role },
  reason?: string
) {
  const sale = await db.sales.get(saleId);
  if (!sale) throw new Error("Fatura não encontrada");
  const settings = await getSettings();

  if (user.role === "ADMIN" || settings.allowOperatorSecondCopy) {
    await db.sales.update(saleId, {
      reprintCount: (sale.reprintCount || 0) + 1,
    });
    await logAudit("SECOND_COPY", sale.invoiceNumber, user);
    return { approved: true as const, saleId };
  }

  await db.secondCopyRequests.add({
    saleId,
    invoiceNumber: sale.invoiceNumber,
    requestedBy: user.id,
    requestedByName: user.name,
    status: "PENDING",
    reason: reason || "2ª via solicitada",
    createdAt: Date.now(),
  });
  await logAudit("SECOND_COPY_REQ", sale.invoiceNumber, user);
  return { approved: false as const, pending: true as const };
}

export async function resolveSecondCopy(
  requestId: number,
  admin: { id: number; name: string; role: Role },
  approve: boolean
) {
  if (admin.role !== "ADMIN") throw new Error("Apenas admin.");
  const req = await db.secondCopyRequests.get(requestId);
  if (!req || req.status !== "PENDING") throw new Error("Pedido inválido");
  await db.secondCopyRequests.update(requestId, {
    status: approve ? "APPROVED" : "REJECTED",
    adminId: admin.id,
    resolvedAt: Date.now(),
  });
  if (approve) {
    const sale = await db.sales.get(req.saleId);
    if (sale) {
      await db.sales.update(req.saleId, {
        reprintCount: (sale.reprintCount || 0) + 1,
      });
    }
  }
  await logAudit(
    approve ? "SECOND_COPY_OK" : "SECOND_COPY_NO",
    req.invoiceNumber,
    admin
  );
  return req.saleId;
}

export async function listUsers() {
  return db.users.orderBy("createdAt").reverse().toArray();
}

export async function addUser(input: {
  username: string;
  password: string;
  name: string;
  role: Role;
  autoLogoutTime?: number | null;
  phone?: string | null;
}) {
  const exists = await db.users
    .where("username")
    .equals(input.username.trim())
    .first();
  if (exists) throw new Error("Utilizador já existe");
  return db.users.add({
    username: input.username.trim(),
    password: await bcrypt.hash(input.password, 10),
    name: input.name.trim(),
    role: input.role,
    autoLogoutTime: input.autoLogoutTime ?? null,
    phone: input.phone ?? null,
    active: true,
    createdAt: Date.now(),
  });
}

export async function listWarehouses() {
  return db.warehouses.toArray();
}

export async function listClients(q = "") {
  const all = await db.clients.orderBy("createdAt").reverse().toArray();
  if (!q.trim()) return all;
  const s = q.toLowerCase();
  return all.filter(
    (c) =>
      c.name.toLowerCase().includes(s) ||
      (c.nif && c.nif.includes(s)) ||
      (c.phone && c.phone.includes(s))
  );
}

export async function addClient(input: {
  name: string;
  nif?: string;
  phone?: string;
  email?: string;
  address?: string;
}) {
  return db.clients.add({
    name: input.name.trim(),
    nif: input.nif?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    createdAt: Date.now(),
  });
}

export async function addExpense(
  input: {
    category: ExpenseCategory;
    description: string;
    amount: number;
    date?: number;
  },
  operator: { id: number; name: string; role: Role }
) {
  if (operator.role !== "ADMIN")
    throw new Error("Apenas admin regista despesas.");
  const id = await db.expenses.add({
    category: input.category,
    description: input.description.trim(),
    amount: Number(input.amount),
    operatorId: operator.id,
    date: input.date || Date.now(),
    createdAt: Date.now(),
  });
  await logAudit("EXPENSE", `${input.category}: ${input.amount}`, operator);
  return id;
}

export async function listExpenses() {
  return db.expenses.orderBy("date").reverse().toArray();
}

export async function openCashSession(
  operator: { id: number; name: string },
  openingFloat: number
) {
  const open = await getOpenCashSession(operator.id);
  if (open) throw new Error("Já existe sessão de caixa aberta.");
  return db.cashSessions.add({
    operatorId: operator.id,
    operatorName: operator.name,
    openedAt: Date.now(),
    openingFloat: Number(openingFloat),
    status: "OPEN",
  });
}

export async function closeCashSession(
  sessionId: number,
  closingCash: number,
  notes?: string
) {
  const session = await db.cashSessions.get(sessionId);
  if (!session) throw new Error("Sessão inválida");
  if (session.status === "CLOSED") throw new Error("Sessão já fechada");

  const allSales = await db.sales
    .where("operatorId")
    .equals(session.operatorId)
    .toArray();
  const sales = allSales.filter(
    (s) =>
      s.status === "COMPLETED" &&
      s.createdAt >= session.openedAt &&
      (s.paymentMethod === "CASH" || !s.paymentMethod)
  );
  const cashSales = sales.reduce((a, s) => a + s.totalAmount, 0);
  const expected = session.openingFloat + cashSales;
  const diff = Number(closingCash) - expected;
  await db.cashSessions.update(sessionId, {
    closedAt: Date.now(),
    closingCash: Number(closingCash),
    expectedCash: expected,
    difference: diff,
    notes: notes || null,
    status: "CLOSED",
  });
  return { expected, diff, cashSales };
}

export async function getOpenCashSession(operatorId: number) {
  const rows = await db.cashSessions
    .where("operatorId")
    .equals(operatorId)
    .toArray();
  return rows.find((s) => s.status === "OPEN") || null;
}

export async function addAnnouncement(message: string, adminId: number) {
  return db.announcements.add({
    message: message.trim(),
    adminId,
    createdAt: Date.now(),
  });
}

/** Advanced accounting stats */
export async function getAccountingStats(from?: number, to?: number) {
  const fromT = from || 0;
  const toT = to || Date.now();
  const sales = (await db.sales.where("status").equals("COMPLETED").toArray()).filter(
    (s) => s.createdAt >= fromT && s.createdAt <= toT
  );
  const expenses = (await db.expenses.toArray()).filter(
    (e) => e.date >= fromT && e.date <= toT
  );
  const parts = await db.parts.toArray();
  const items = await db.saleItems.toArray();
  const saleIds = new Set(sales.map((s) => s.id!));
  const periodItems = items.filter((i) => saleIds.has(i.saleId));

  const revenue = sales.reduce((a, s) => a + s.totalAmount, 0);
  const cogs = sales.reduce((a, s) => a + (s.costTotal || s.totalAmount - s.profit), 0);
  const grossProfit = sales.reduce((a, s) => a + s.profit, 0);
  const expenseTotal = expenses.reduce((a, e) => a + e.amount, 0);
  const netProfit = grossProfit - expenseTotal;
  const taxCollected = sales.reduce((a, s) => a + (s.taxAmount || 0), 0);
  const discounts = sales.reduce((a, s) => a + (s.discount || 0), 0);

  // by payment
  const byPayment: Record<string, number> = {};
  for (const s of sales) {
    const m = s.paymentMethod || "CASH";
    byPayment[m] = (byPayment[m] || 0) + s.totalAmount;
  }

  // by operator
  const byOperator: Record<
    string,
    { name: string; sales: number; revenue: number; profit: number }
  > = {};
  for (const s of sales) {
    const key = String(s.operatorId || 0);
    if (!byOperator[key]) {
      byOperator[key] = {
        name: s.operatorName || `Op #${s.operatorId}`,
        sales: 0,
        revenue: 0,
        profit: 0,
      };
    }
    byOperator[key].sales += 1;
    byOperator[key].revenue += s.totalAmount;
    byOperator[key].profit += s.profit;
  }

  // top products
  const prodMap: Record<
    string,
    { name: string; qty: number; revenue: number }
  > = {};
  for (const it of periodItems) {
    const k = String(it.partId);
    if (!prodMap[k])
      prodMap[k] = { name: it.partName || `#${it.partId}`, qty: 0, revenue: 0 };
    prodMap[k].qty += it.quantity;
    prodMap[k].revenue += it.totalPrice;
  }
  const topProducts = Object.values(prodMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // daily series (last 30 days of range)
  const dayMap: Record<string, { revenue: number; profit: number; count: number }> =
    {};
  for (const s of sales) {
    const d = new Date(s.createdAt).toISOString().slice(0, 10);
    if (!dayMap[d]) dayMap[d] = { revenue: 0, profit: 0, count: 0 };
    dayMap[d].revenue += s.totalAmount;
    dayMap[d].profit += s.profit;
    dayMap[d].count += 1;
  }
  const daily = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  // expenses by category
  const expByCat: Record<string, number> = {};
  for (const e of expenses) {
    expByCat[e.category] = (expByCat[e.category] || 0) + e.amount;
  }

  const stockValue = parts.reduce((a, p) => a + p.price * p.stock, 0);
  const stockCost = parts.reduce((a, p) => a + p.cost * p.stock, 0);
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return {
    revenue,
    cogs,
    grossProfit,
    expenseTotal,
    netProfit,
    taxCollected,
    discounts,
    salesCount: sales.length,
    avgTicket: sales.length ? revenue / sales.length : 0,
    margin,
    byPayment,
    byOperator: Object.values(byOperator),
    topProducts,
    daily,
    expByCat,
    stockValue,
    stockCost,
  };
}

export async function exportBackup() {
  const tables = [
    "users",
    "settings",
    "warehouses",
    "parts",
    "sales",
    "saleItems",
    "announcements",
    "clients",
    "expenses",
    "cashSessions",
    "stockMovements",
    "auditLogs",
    "secondCopyRequests",
  ] as const;
  const data: Record<string, unknown[]> = {};
  for (const t of tables) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data[t] = await (db as any)[t].toArray();
  }
  return {
    app: "MAKINA",
    version: 2,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export async function importBackup(payload: {
  data: Record<string, unknown[]>;
}) {
  if (!payload?.data) throw new Error("Backup inválido");
  const tables = Object.keys(payload.data);
  await db.transaction("rw", db.tables, async () => {
    for (const t of tables) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const table = (db as any)[t];
      if (!table) continue;
      await table.clear();
      const rows = payload.data[t] || [];
      if (rows.length) await table.bulkAdd(rows);
    }
  });
}

export async function listPendingSecondCopies() {
  return db.secondCopyRequests
    .where("status")
    .equals("PENDING")
    .reverse()
    .sortBy("createdAt");
}

export async function listAuditLogs(limit = 100) {
  return db.auditLogs.orderBy("createdAt").reverse().limit(limit).toArray();
}

export async function listStockMovements(limit = 100) {
  return db.stockMovements.orderBy("createdAt").reverse().limit(limit).toArray();
}

export function money(n: number) {
  try {
    return Number(n).toLocaleString("pt-AO", {
      style: "currency",
      currency: "AOA",
      maximumFractionDigits: 2,
    });
  } catch {
    return `${Number(n).toLocaleString("pt-AO")} Kz`;
  }
}

export function moneyShort(n: number) {
  return `${Number(n || 0).toLocaleString("pt-AO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} Kz`;
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: "Numerário",
  TRANSFER: "Transferência",
  CARD: "Cartão",
  MULTICAIXA: "Multicaixa",
  MIXED: "Misto",
};

export const EXPENSE_LABELS: Record<ExpenseCategory, string> = {
  RENT: "Renda",
  SALARY: "Salários",
  UTILITIES: "Utilidades",
  SUPPLIES: "Fornecimentos",
  TRANSPORT: "Transporte",
  TAX: "Impostos",
  MAINTENANCE: "Manutenção",
  OTHER: "Outros",
};
