import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { warehouses } from "@/db/schema";
import { ensureDb } from "@/lib/with-db";

export async function GET() {
  await ensureDb();
  const db = await getDb();
  const data = await db.select().from(warehouses);
  return NextResponse.json({ warehouses: data });
}
