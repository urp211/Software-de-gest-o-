import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import * as schema from "./schema";

function resolveDbPath() {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }

  const candidates = [
    path.join(process.cwd(), "data", "makina.db"),
    path.join(__dirname, "..", "..", "data", "makina.db"),
  ];

  for (const candidate of candidates) {
    const dir = path.dirname(candidate);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      return candidate;
    } catch {
      // try next
    }
  }

  return path.join(process.cwd(), "makina.db");
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'OPERATOR',
  name TEXT NOT NULL,
  photo_url TEXT,
  auto_logout_time INTEGER,
  created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s','now') as integer) * 1000)
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL DEFAULT 'MAKINA Company',
  nif TEXT DEFAULT '000000000',
  address TEXT DEFAULT 'Luanda, Angola'
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  nif TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s','now') as integer) * 1000)
);

CREATE TABLE IF NOT EXISTS warehouses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT
);

CREATE TABLE IF NOT EXISTS parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  condition TEXT NOT NULL DEFAULT 'NEW',
  price REAL NOT NULL,
  cost REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  warehouse_id INTEGER REFERENCES warehouses(id),
  image_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s','now') as integer) * 1000)
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT NOT NULL UNIQUE,
  client_id INTEGER REFERENCES clients(id),
  operator_id INTEGER REFERENCES users(id),
  total_amount REAL NOT NULL,
  profit REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s','now') as integer) * 1000)
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  part_id INTEGER NOT NULL REFERENCES parts(id),
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  admin_id INTEGER REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s','now') as integer) * 1000)
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  details TEXT,
  created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s','now') as integer) * 1000)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'INFO',
  is_read INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s','now') as integer) * 1000)
);
`;

type MakinaDb = ReturnType<typeof drizzle<typeof schema>>;
type SqliteHandle = InstanceType<typeof Database>;

const globalForDb = globalThis as typeof globalThis & {
  __makinaSqlite?: SqliteHandle;
  __makinaDb?: MakinaDb;
  __makinaDbPath?: string;
};

export const dbPath = resolveDbPath();

function createDb(): MakinaDb {
  if (globalForDb.__makinaDb) return globalForDb.__makinaDb;

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(SCHEMA_SQL);

  const db = drizzle(sqlite, { schema });

  globalForDb.__makinaSqlite = sqlite;
  globalForDb.__makinaDb = db;
  globalForDb.__makinaDbPath = dbPath;
  return db;
}

/** Ensures the SQLite engine is ready. */
export async function getDb(): Promise<MakinaDb> {
  return createDb();
}

export const db = new Proxy({} as MakinaDb, {
  get(_target, prop, receiver) {
    const real = createDb();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export async function flushDb() {
  // node:sqlite writes synchronously
}
