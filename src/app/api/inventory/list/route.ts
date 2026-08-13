import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { parts } from "@/db/schema";
import { gt } from "drizzle-orm";
import { ensureDb } from "@/lib/with-db";

export async function GET() {
  await ensureDb();
  const db = await getDb();
  const data = await db.select().from(parts).where(gt(parts.stock, 0));
  return NextResponse.json({ parts: data });
}
