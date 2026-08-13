import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = "makina-super-secret-key-for-local-dev";
const encodedKey = new TextEncoder().encode(secretKey);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const session = req.cookies.get("session")?.value;

    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      await jwtVerify(session, encodedKey, {
        algorithms: ["HS256"],
      });
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Redirect root to dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
