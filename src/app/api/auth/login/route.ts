import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { ensureDb } from "@/lib/with-db";

export async function POST(req: Request) {
  await ensureDb();
  const db = await getDb();

  const { username, password } = await req.json();

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  await createSession(user.id, user.role, user.autoLogoutTime);

  return NextResponse.json({ success: true, role: user.role });
}
