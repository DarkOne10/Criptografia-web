import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { getRoleIdByName, initializeDatabase, pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await initializeDatabase();

    const body = (await request.json()) as {
      username?: string;
      password?: string;
      role?: string;
    };

    const username = (body.username ?? "").trim();
    const password = body.password ?? "";
    const role = (body.role ?? "usuario").trim().toLowerCase();

    if (!username || password.length < 6) {
      return NextResponse.json(
        {
          ok: false,
          message: "El username es obligatorio y la contraseña debe tener al menos 6 caracteres.",
        },
        { status: 400 },
      );
    }

    if (!["admin", "usuario"].includes(role)) {
      return NextResponse.json(
        {
          ok: false,
          message: "El rol indicado no es válido.",
        },
        { status: 400 },
      );
    }

    const existingUser = await pool.query(
      "SELECT id FROM usuarios WHERE username = $1 LIMIT 1",
      [username],
    );

    if (existingUser.rowCount && existingUser.rowCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Ese usuario ya existe.",
        },
        { status: 409 },
      );
    }

    const roleId = await getRoleIdByName(role);

    if (!roleId) {
      return NextResponse.json(
        {
          ok: false,
          message: "No fue posible asignar el rol del usuario.",
        },
        { status: 500 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
        INSERT INTO usuarios (username, password_hash, rol_id, intentos_fallidos, bloqueado_hasta)
        VALUES ($1, $2, $3, 0, NULL)
        RETURNING id, username, rol_id
      `,
      [username, passwordHash, roleId],
    );

    return NextResponse.json({
      ok: true,
      message: "Usuario registrado correctamente.",
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Error al registrar el usuario.",
      },
      { status: 500 },
    );
  }
}
