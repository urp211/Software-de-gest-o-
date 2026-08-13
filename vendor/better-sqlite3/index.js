/**
 * Drop-in shim: better-sqlite3 API backed by Node.js built-in node:sqlite (Node 22+).
 * Enough surface area for drizzle-orm/better-sqlite3.
 */
const { DatabaseSync } = require("node:sqlite");

/** node:sqlite returns null-prototype rows; drizzle expects plain objects. */
function plain(row) {
  if (row == null || typeof row !== "object") return row;
  if (Array.isArray(row)) return row;
  return { ...row };
}

function plainAll(rows) {
  return Array.isArray(rows) ? rows.map(plain) : rows;
}

function flatten(params) {
  if (params.length === 1 && Array.isArray(params[0])) return params[0];
  if (
    params.length === 1 &&
    params[0] &&
    typeof params[0] === "object" &&
    !Buffer.isBuffer(params[0]) &&
    !Array.isArray(params[0])
  ) {
    return [params[0]];
  }
  return params;
}

class Statement {
  constructor(stmt, { raw = false } = {}) {
    this._stmt = stmt;
    this._raw = raw;
    if (raw && typeof stmt.setReturnArrays === "function") {
      stmt.setReturnArrays(true);
    }
  }

  run(...params) {
    const args = flatten(params);
    const info = args.length ? this._stmt.run(...args) : this._stmt.run();
    return {
      changes: Number(info?.changes ?? 0),
      lastInsertRowid: Number(info?.lastInsertRowid ?? 0),
    };
  }

  get(...params) {
    const args = flatten(params);
    const row = args.length ? this._stmt.get(...args) : this._stmt.get();
    return this._raw ? row : plain(row);
  }

  all(...params) {
    const args = flatten(params);
    const rows = args.length ? this._stmt.all(...args) : this._stmt.all();
    return this._raw ? rows : plainAll(rows);
  }

  iterate(...params) {
    const args = flatten(params);
    const it = args.length ? this._stmt.iterate(...args) : this._stmt.iterate();
    const raw = this._raw;
    return (function* () {
      for (const row of it) yield raw ? row : plain(row);
    })();
  }

  /** better-sqlite3: stmt.raw() → returns rows as arrays (needed by drizzle) */
  raw(raw = true) {
    return new Statement(this._stmt, { raw: !!raw });
  }

  pluck() {
    return this;
  }
  expand() {
    return this;
  }
  safeIntegers() {
    return this;
  }
  columns() {
    try {
      return this._stmt.columns?.() ?? [];
    } catch {
      return [];
    }
  }
  bind() {
    return this;
  }
}

class Database {
  constructor(filename = ":memory:", options = {}) {
    this.name = filename;
    this.open = true;
    this.readonly = !!(options && options.readonly);
    this.memory = filename === ":memory:";
    this._db = new DatabaseSync(filename, {
      readOnly: this.readonly,
    });
  }

  prepare(sql) {
    return new Statement(this._db.prepare(sql));
  }

  exec(sql) {
    this._db.exec(sql);
    return this;
  }

  pragma(source, options) {
    const sql = `PRAGMA ${source}`;
    try {
      if (options && options.simple) {
        const row = plain(this._db.prepare(sql).get());
        if (!row) return undefined;
        return Object.values(row)[0];
      }
      if (/=/.test(source)) {
        this._db.exec(sql);
        return [];
      }
      return plainAll(this._db.prepare(sql).all());
    } catch {
      this._db.exec(sql);
      return [];
    }
  }

  /**
   * better-sqlite3 transaction returns a function with .deferred/.immediate/.exclusive
   * Drizzle calls: client.transaction(fn)[behavior](tx)
   */
  transaction(fn) {
    const self = this;
    const run = (behavior) => {
      return function (...args) {
        const begin =
          behavior === "immediate"
            ? "BEGIN IMMEDIATE"
            : behavior === "exclusive"
              ? "BEGIN EXCLUSIVE"
              : "BEGIN";
        self.exec(begin);
        try {
          const result = fn.apply(this, args);
          self.exec("COMMIT");
          return result;
        } catch (e) {
          try {
            self.exec("ROLLBACK");
          } catch {
            /* ignore */
          }
          throw e;
        }
      };
    };

    const wrapped = run("deferred");
    wrapped.deferred = run("deferred");
    wrapped.immediate = run("immediate");
    wrapped.exclusive = run("exclusive");
    return wrapped;
  }

  close() {
    if (this.open) {
      this._db.close();
      this.open = false;
    }
  }

  backup() {
    throw new Error("backup not implemented in shim");
  }
  serialize() {
    throw new Error("serialize not implemented in shim");
  }
  function() {
    return this;
  }
  aggregate() {
    return this;
  }
  table() {
    return this;
  }
  loadExtension() {
    return this;
  }
  defaultSafeIntegers() {
    return this;
  }
  unsafeMode() {
    return this;
  }
}

module.exports = Database;
module.exports.Database = Database;
module.exports.default = Database;
