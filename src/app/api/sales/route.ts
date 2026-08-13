import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sales, saleItems, parts } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/lib/with-db";

export async function POST(req: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { items } = await req.json();

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const invoiceNumber = `MAK-INV-${dateStr}-${randomStr}`;

    let totalAmount = 0;
    let totalCost = 0;

    for (const item of items) {
      totalAmount += Number(item.price) * Number(item.quantity);
      totalCost += Number(item.cost) * Number(item.quantity);
    }

    const profit = totalAmount - totalCost;

    const newSaleRes = await db
      .insert(sales)
      .values({
        invoiceNumber,
        operatorId: session.userId,
        totalAmount,
        profit,
        status: "COMPLETED",
      })
      .returning({ id: sales.id });

    const saleId = newSaleRes[0].id;

    for (const item of items) {
      await db.insert(saleItems).values({
        saleId,
        partId: item.id,
        quantity: item.quantity,
        unitPrice: Number(item.price),
        totalPrice: Number(item.price) * Number(item.quantity),
      });

      const part = await db.query.parts.findFirst({
        where: eq(parts.id, item.id),
      });
      if (part) {
        await db
          .update(parts)
          .set({ stock: part.stock - item.quantity })
          .where(eq(parts.id, item.id));
      }
    }

    return NextResponse.json({ success: true, invoiceNumber });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao processar venda" }, { status: 500 });
  }
}
