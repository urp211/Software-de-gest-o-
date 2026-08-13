import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/with-db";

export async function GET() {
  try {
    await ensureDb();
    return NextResponse.json({ status: "ok" });
  } catch (e) {
    return NextResponse.json(
      { status: "error", message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
