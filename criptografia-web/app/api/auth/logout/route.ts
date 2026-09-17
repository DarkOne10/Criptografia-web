import { NextResponse } from "next/server";

import { getSessionCookieOptions } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true, message: "Sesión cerrada." });
  const cookieOptions = getSessionCookieOptions(request);

  response.cookies.set("auth_session", "", {
    ...cookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
