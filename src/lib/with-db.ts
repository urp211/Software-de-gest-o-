import { getDb } from "@/db";
import { seedDb } from "@/db/seed";

let seeded = false;

/** Initialize SQLite + run seed once per process. */
export async function ensureDb() {
  await getDb();
  if (!seeded) {
    await seedDb().catch(console.error);
    seeded = true;
  }
}
