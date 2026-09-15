import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const cookie = cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith("auth_session="));

    if (!cookie) {
      return NextResponse.json({ ok: false, message: "No autenticado" }, { status: 401 });
    }

    const value = decodeURIComponent(cookie.split("=")[1] ?? "");

    if (!value) {
      return NextResponse.json({ ok: false, message: "No autenticado" }, { status: 401 });
    }

    const session = JSON.parse(value);

    return NextResponse.json({
      ok: true,
      user: {
        id: session.id,
        username: session.username,
        role: session.role,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, message: "No autenticado" }, { status: 401 });
  }
}
