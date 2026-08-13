import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/with-db";

export async function GET() {
  await ensureDb();
  return NextResponse.json({ success: true });
}
