import { getDb } from "@/db";
import { users, settings, warehouses } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedDb() {
  const db = await getDb();

  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.username, "MAKINA"),
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admmakina", 10);
    await db.insert(users).values({
      username: "MAKINA",
      password: hashedPassword,
      role: "ADMIN",
      name: "Administrador Geral",
    });
    console.log("Admin user created.");
  }

  const existingSettings = await db.query.settings.findFirst();
  if (!existingSettings) {
    await db.insert(settings).values({
      companyName: "MAKINA Company",
      nif: "000000000",
      address: "Luanda, Angola",
    });
    console.log("Default settings created.");
  }

  const existingWarehouse = await db.query.warehouses.findFirst();
  if (!existingWarehouse) {
    await db.insert(warehouses).values({
      name: "Armazém Principal",
      location: "Sede",
    });
    console.log("Default warehouse created.");
  }
}
