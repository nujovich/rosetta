// load/migrate.ts
// Runner de migraciones mínimo y sin dependencias extra. Aplica los .sql de
// db/migrations/ en orden lexicográfico, una sola vez cada uno, registrando los
// aplicados en `_rosetta_migrations`. Es idempotente: re-correrlo no re-aplica
// nada ya aplicado. Reemplaza a la tooling de Supabase para no atar el proyecto
// a ese stack — funciona contra cualquier Postgres.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import { withTransaction } from './db.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// src/load/ -> raíz del repo -> db/migrations
export const MIGRATIONS_DIR = path.resolve(HERE, '..', '..', 'db', 'migrations');

export interface MigrationResult {
  aplicadas: string[];
  yaAplicadas: string[];
}

function listMigrationFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));
}

export async function migrate(pool: Pool, dir: string = MIGRATIONS_DIR): Promise<MigrationResult> {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS _rosetta_migrations (
       nombre TEXT PRIMARY KEY,
       aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
  );

  const { rows } = await pool.query<{ nombre: string }>('SELECT nombre FROM _rosetta_migrations');
  const aplicadasPrevias = new Set(rows.map((r) => r.nombre));

  const result: MigrationResult = { aplicadas: [], yaAplicadas: [] };

  for (const file of listMigrationFiles(dir)) {
    if (aplicadasPrevias.has(file)) {
      result.yaAplicadas.push(file);
      continue;
    }
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    // Cada migración + su registro, atómicos: o entra entera o no entra.
    await withTransaction(pool, async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO _rosetta_migrations (nombre) VALUES ($1)', [file]);
    });
    result.aplicadas.push(file);
  }

  return result;
}
