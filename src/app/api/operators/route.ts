import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { ensureDb } from "@/lib/with-db";

export async function POST(req: Request) {
  await ensureDb();
  const session = await getSession();

  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { username, password, name, role, autoLogoutTime } = await req.json();
  const db = await getDb();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      username,
      password: hashedPassword,
      name,
      role: role || "OPERATOR",
      autoLogoutTime: autoLogoutTime || null,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar operador. O utilizador pode já existir." },
      { status: 400 }
    );
  }
}
