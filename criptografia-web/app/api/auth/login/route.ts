import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { initializeDatabase, pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await initializeDatabase();

    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = (body.username ?? "").trim();
    const password = body.password ?? "";

    if (!username || !password) {
      return NextResponse.json(
        {
          ok: false,
          message: "Username y contraseña son obligatorios.",
        },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
        SELECT u.id, u.username, u.password_hash, u.intentos_fallidos, u.bloqueado_hasta, r.nombre AS role_name
        FROM usuarios u
        INNER JOIN roles r ON r.id = u.rol_id
        WHERE u.username = $1
        LIMIT 1
      `,
      [username],
    );

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Credenciales inválidas.",
        },
        { status: 401 },
      );
    }

    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta).getTime() > Date.now()) {
      return NextResponse.json(
        {
          ok: false,
          message: "Cuenta bloqueada temporalmente por demasiados intentos fallidos.",
        },
        { status: 403 },
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      const nextIntentos = Number(user.intentos_fallidos) + 1;
      const bloqueo = nextIntentos >= 5;

      await pool.query(
        `
          UPDATE usuarios
          SET intentos_fallidos = $1,
              bloqueado_hasta = $2
          WHERE id = $3
        `,
        [nextIntentos, bloqueo ? new Date(Date.now() + 15 * 60 * 1000) : null, user.id],
      );

      return NextResponse.json(
        {
          ok: false,
          message: bloqueo
            ? "Cuenta bloqueada por 15 minutos por demasiados intentos fallidos."
            : `Credenciales inválidas. Intentos fallidos: ${nextIntentos}/5`,
        },
        { status: 401 },
      );
    }

    await pool.query(
      `
        UPDATE usuarios
        SET intentos_fallidos = 0,
            bloqueado_hasta = NULL
        WHERE id = $1
      `,
      [user.id],
    );

    const response = NextResponse.json({
      ok: true,
      message: "Inicio de sesión exitoso.",
      user: {
        id: user.id,
        username: user.username,
        role: user.role_name,
      },
    });

    response.cookies.set("auth_session", JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role_name,
    }), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Error al iniciar sesión.",
      },
      { status: 500 },
    );
  }
}
