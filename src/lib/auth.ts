import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const secretKey = "makina-super-secret-key-for-local-dev";
const encodedKey = new TextEncoder().encode(secretKey);

export async function createSession(
  userId: number,
  role: string,
  autoLogoutTime: number | null
) {
  const expiresAt = new Date(
    Date.now() +
      (autoLogoutTime
        ? autoLogoutTime * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000)
  );
  const session = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(encodedKey);

  // Electron serves over http://127.0.0.1 — never force secure cookies
  (await cookies()).set("session", session, {
    httpOnly: true,
    secure: false,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  (await cookies()).delete("session");
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as { userId: number; role: string };
  } catch {
    return null;
  }
}
