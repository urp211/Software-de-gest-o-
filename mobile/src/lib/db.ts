import Dexie, { type Table } from "dexie";
import bcrypt from "bcryptjs";

export type Role = "ADMIN" | "OPERATOR";
export type PartCondition = "NEW" | "USED";
export type SaleStatus = "COMPLETED" | "CANCELLED";

export interface User {
  id?: number;
  username: string;
  password: string;
  role: Role;
  name: string;
  photoUrl?: string | null;
  autoLogoutTime?: number | null;
  createdAt: number;
}

export interface Settings {
  id?: number;
  companyName: string;
  nif: string;
  address: string;
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
  warehouseId?: number | null;
  imageUrl?: string | null;
  createdAt: number;
}

export interface Sale {
  id?: number;
  invoiceNumber: string;
  clientId?: number | null;
  operatorId?: number | null;
  totalAmount: number;
  profit: number;
  status: SaleStatus;
  createdAt: number;
}

export interface SaleItem {
  id?: number;
  saleId: number;
  partId: number;
  quantity: number;
  unitPrice: number;
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
  createdAt: number;
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

  constructor() {
    super("makina_offline_v1");
    this.version(1).stores({
      users: "++id, username, role, createdAt",
      settings: "++id",
      warehouses: "++id, name",
      parts: "++id, trackingCode, name, warehouseId, createdAt, stock",
      sales: "++id, invoiceNumber, operatorId, status, createdAt",
      saleItems: "++id, saleId, partId",
      announcements: "++id, createdAt",
      clients: "++id, name, createdAt",
    });
  }
}

export const db = new MakinaDB();

function code(prefix: string) {
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}-${dateStr}-${randomStr}`;
}

export async function seedIfNeeded() {
  const admin = await db.users.where("username").equals("MAKINA").first();
  if (!admin) {
    await db.users.add({
      username: "MAKINA",
      password: await bcrypt.hash("admmakina", 10),
      role: "ADMIN",
      name: "Administrador Geral",
      createdAt: Date.now(),
    });
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      companyName: "MAKINA Company",
      nif: "000000000",
      address: "Luanda, Angola",
    });
  }

  const whCount = await db.warehouses.count();
  if (whCount === 0) {
    await db.warehouses.add({
      name: "Armazém Principal",
      location: "Sede",
    });
  }
}

export async function login(username: string, password: string) {
  await seedIfNeeded();
  const user = await db.users.where("username").equals(username.trim()).first();
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;
  return {
    id: user.id!,
    username: user.username,
    name: user.name,
    role: user.role,
    autoLogoutTime: user.autoLogoutTime ?? null,
  };
}

export async function getDashboardStats() {
  const parts = await db.parts.toArray();
  const sales = await db.sales.where("status").equals("COMPLETED").toArray();
  const totalParts = parts.length;
  const totalUnits = parts.reduce((a, p) => a + p.stock, 0);
  const stockValue = parts.reduce((a, p) => a + p.price * p.stock, 0);
  const revenue = sales.reduce((a, s) => a + s.totalAmount, 0);
  const profit = sales.reduce((a, s) => a + s.profit, 0);
  const announcements = await db.announcements.orderBy("createdAt").reverse().limit(5).toArray();
  return { totalParts, totalUnits, stockValue, revenue, profit, salesCount: sales.length, announcements };
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
          p.trackingCode.toLowerCase().includes(q)
      )
    : all;
  return filtered.map((p) => ({
    ...p,
    warehouseName: p.warehouseId ? whMap.get(p.warehouseId)?.name ?? "—" : "Sem armazém",
  }));
}

export async function addPart(input: {
  name: string;
  description?: string;
  condition: PartCondition;
  price: number;
  cost: number;
  stock: number;
  warehouseId?: number | null;
}) {
  const trackingCode = code("MAK");
  const id = await db.parts.add({
    trackingCode,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    condition: input.condition,
    price: Number(input.price),
    cost: Number(input.cost),
    stock: Number(input.stock),
    warehouseId: input.warehouseId ?? null,
    createdAt: Date.now(),
  });
  return { id, trackingCode };
}

export async function listSales() {
  return db.sales.orderBy("createdAt").reverse().toArray();
}

export async function createSale(
  items: { id: number; price: number; cost: number; quantity: number }[],
  operatorId: number
) {
  if (!items.length) throw new Error("Carrinho vazio");

  return db.transaction("rw", db.parts, db.sales, db.saleItems, async () => {
    for (const item of items) {
      const part = await db.parts.get(item.id);
      if (!part) throw new Error("Peça não encontrada");
      if (part.stock < item.quantity) throw new Error(`Stock insuficiente: ${part.name}`);
    }

    let totalAmount = 0;
    let totalCost = 0;
    for (const item of items) {
      totalAmount += item.price * item.quantity;
      totalCost += item.cost * item.quantity;
    }
    const profit = totalAmount - totalCost;
    const invoiceNumber = code("MAK-INV");

    const saleId = await db.sales.add({
      invoiceNumber,
      operatorId,
      totalAmount,
      profit,
      status: "COMPLETED",
      createdAt: Date.now(),
    });

    for (const item of items) {
      await db.saleItems.add({
        saleId,
        partId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
      });
      const part = await db.parts.get(item.id);
      if (part) {
        await db.parts.update(item.id, { stock: part.stock - item.quantity });
      }
    }

    return { saleId, invoiceNumber, totalAmount, profit };
  });
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
}) {
  const exists = await db.users.where("username").equals(input.username.trim()).first();
  if (exists) throw new Error("Utilizador já existe");
  return db.users.add({
    username: input.username.trim(),
    password: await bcrypt.hash(input.password, 10),
    name: input.name.trim(),
    role: input.role,
    autoLogoutTime: input.autoLogoutTime ?? null,
    createdAt: Date.now(),
  });
}

export async function listWarehouses() {
  return db.warehouses.toArray();
}

export async function getSettings() {
  return (await db.settings.toCollection().first()) ?? {
    companyName: "MAKINA Company",
    nif: "000000000",
    address: "Luanda, Angola",
  };
}

export async function updateSettings(patch: Partial<Settings>) {
  const current = await db.settings.toCollection().first();
  if (!current?.id) {
    await db.settings.add({
      companyName: patch.companyName || "MAKINA Company",
      nif: patch.nif || "000000000",
      address: patch.address || "Luanda, Angola",
    });
    return;
  }
  await db.settings.update(current.id, patch);
}

export async function addAnnouncement(message: string, adminId: number) {
  return db.announcements.add({
    message: message.trim(),
    adminId,
    createdAt: Date.now(),
  });
}

export function money(n: number) {
  try {
    return Number(n).toLocaleString("pt-AO", {
      style: "currency",
      currency: "AOA",
      maximumFractionDigits: 0,
    });
  } catch {
    return `${Number(n).toLocaleString("pt-AO")} Kz`;
  }
}

export function moneyShort(n: number) {
  return `${Number(n).toLocaleString("pt-AO")} Kz`;
}
