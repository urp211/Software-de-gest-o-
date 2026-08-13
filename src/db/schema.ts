import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("OPERATOR"), // ADMIN or OPERATOR
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  autoLogoutTime: integer("auto_logout_time"), // in minutes
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyName: text("company_name").notNull().default("MAKINA Company"),
  nif: text("nif").default("000000000"),
  address: text("address").default("Luanda, Angola"),
});

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nif: text("nif"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const warehouses = sqliteTable("warehouses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  location: text("location"),
});

export const parts = sqliteTable("parts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackingCode: text("tracking_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  condition: text("condition").notNull().default("NEW"), // NEW or USED
  price: real("price").notNull(),
  cost: real("cost").notNull(),
  stock: integer("stock").notNull().default(0),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  imageUrl: text("image_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientId: integer("client_id").references(() => clients.id),
  operatorId: integer("operator_id").references(() => users.id),
  totalAmount: real("total_amount").notNull(),
  profit: real("profit").notNull(),
  status: text("status").notNull().default("COMPLETED"), // COMPLETED, CANCELLED
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const saleItems = sqliteTable("sale_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  saleId: integer("sale_id")
    .references(() => sales.id)
    .notNull(),
  partId: integer("part_id")
    .references(() => parts.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
});

export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  message: text("message").notNull(),
  adminId: integer("admin_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const logs = sqliteTable("logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  message: text("message").notNull(),
  type: text("type").notNull().default("INFO"), // AUTH_REQ, INFO
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const partsRelations = relations(parts, ({ one }) => ({
  warehouse: one(warehouses, {
    fields: [parts.warehouseId],
    references: [warehouses.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  admin: one(users, {
    fields: [announcements.adminId],
    references: [users.id],
  }),
}));
