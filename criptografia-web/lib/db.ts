import { Pool } from "pg";

export const DATABASE_URL =
  "postgresql://neondb_owner:npg_wWj0bTLEvk6D@ep-aged-pond-b5qwx622-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(50) NOT NULL UNIQUE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      rol_id INTEGER NOT NULL REFERENCES roles(id),
      intentos_fallidos INTEGER NOT NULL DEFAULT 0,
      bloqueado_hasta TIMESTAMP NULL
    );
  `);

  await pool.query(`
    INSERT INTO roles (nombre)
    VALUES ('admin'), ('usuario')
    ON CONFLICT (nombre) DO NOTHING;
  `);
}

export async function getRoleIdByName(roleName: string) {
  const result = await pool.query(
    "SELECT id FROM roles WHERE nombre = $1 LIMIT 1",
    [roleName],
  );

  return result.rows[0]?.id ?? null;
}
