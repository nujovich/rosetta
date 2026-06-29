// load/db.ts
// Cableado mínimo a PostgreSQL para la etapa de carga (load). Deliberadamente
// agnóstico: sólo necesita un `DATABASE_URL` estándar de Postgres. Eso hace que
// el mismo loader corra sin cambios contra un Postgres local (Docker Compose),
// Neon, Supabase o cualquier host Postgres. NO depende de features propias de
// Supabase: el esquema es Postgres puro (ver db/migrations/).

import { Pool, type PoolClient } from 'pg';
import { requireDatabaseUrl } from '../config.js';

export function createPool(env: NodeJS.ProcessEnv = process.env): Pool {
  return new Pool({ connectionString: requireDatabaseUrl(env) });
}

// Corre `fn` dentro de una transacción: commit si resuelve, rollback si tira.
export async function withTransaction<T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
