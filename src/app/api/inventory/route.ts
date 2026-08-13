import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { parts } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { ensureDb } from "@/lib/with-db";

export async function POST(req: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = await getDb();

  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const trackingCode = `MAK-${dateStr}-${randomStr}`;

  try {
    await db.insert(parts).values({
      name: body.name,
      description: body.description,
      condition: body.condition,
      price: Number(body.price),
      cost: Number(body.cost),
      stock: Number(body.stock),
      warehouseId: body.warehouseId || null,
      trackingCode,
    });
    return NextResponse.json({ success: true, trackingCode });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao cadastrar peça" }, { status: 400 });
  }
}
