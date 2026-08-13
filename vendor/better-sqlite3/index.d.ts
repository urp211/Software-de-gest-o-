declare class Database {
  constructor(filename?: string, options?: { readonly?: boolean });
  prepare(sql: string): any;
  exec(sql: string): this;
  pragma(source: string, options?: { simple?: boolean }): any;
  transaction<T extends (...args: any[]) => any>(fn: T): T;
  close(): void;
}
export = Database;
