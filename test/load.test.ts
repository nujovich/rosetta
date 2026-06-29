// test/load.test.ts
// Test de la etapa de carga (load) contra un Postgres real. Se SALTEA si no hay
// DATABASE_URL: así `npm test` sin base sigue verde (los contribuyentes no están
// obligados a levantar Postgres). En CI se setea DATABASE_URL contra un servicio
// postgres, de modo que el camino de carga sí se ejercita de punta a punta.
//
// Cubre lo que importa del loader: que persista per-case y referencia, y que sea
// IDEMPOTENTE (recargar la misma publicación no duplica filas).

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import '../src/sources/index.js';
import { getSource } from '../src/core/registry.js';
import { runSource } from '../src/core/pipeline.js';
import { getReferenceSource, runReferenceSource } from '../src/core/reference.js';

const DB = process.env.DATABASE_URL;

// node:test soporta `skip` a nivel de test; agrupamos la condición una vez.
const maybe = DB ? test : test.skip;

// Importes perezosos: sólo si hay DB (evita exigir `pg` configurado al saltear).
let pool: import('pg').Pool;
let loadPerCase: typeof import('../src/load/load.js').loadPerCase;
let loadReferencia: typeof import('../src/load/load.js').loadReferencia;

before(async () => {
  if (!DB) return;
  const { createPool } = await import('../src/load/db.js');
  const { migrate } = await import('../src/load/migrate.js');
  const load = await import('../src/load/load.js');
  loadPerCase = load.loadPerCase;
  loadReferencia = load.loadReferencia;
  pool = createPool();
  await migrate(pool);
});

after(async () => {
  if (pool) await pool.end();
});

// Serializa y reparsea para reproducir el flujo real (run -> JSON -> load).
function asJson<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

maybe('migrate es idempotente (re-aplicar no rompe)', async () => {
  const { migrate } = await import('../src/load/migrate.js');
  const r = await migrate(pool); // ya corrió en before(): no debe re-aplicar nada
  assert.equal(r.aplicadas.length, 0);
  assert.ok(r.yaAplicadas.includes('0001_schema_inicial.sql'));
  assert.ok(r.yaAplicadas.includes('0002_serie_agregada.sql'));
});

maybe('carga per-case (rnfja) y es idempotente', async () => {
  const mod = getSource('rnfja')!;
  const res = runSource(mod, { dir: './fixtures/rnfja-2024', anio: '2024' });
  const payload = asJson(res);
  assert.ok(payload.casos.length > 0, 'el fixture debe producir casos');

  const s1 = await loadPerCase(pool, payload);
  assert.equal(s1.caso_reportado, payload.casos.length);

  const count = async () =>
    Number(
      (await pool.query("SELECT count(*)::int AS n FROM caso_reportado WHERE fuente_id = 'rnfja'"))
        .rows[0].n,
    );
  const tras1 = await count();
  assert.equal(tras1, payload.casos.length, 'una fila por caso');

  // Recargar la MISMA publicación: no debe duplicar (UPSERT por clave natural).
  await loadPerCase(pool, payload);
  assert.equal(await count(), tras1, 'recargar no duplica caso_reportado');

  // Y los dominios 1:1 también quedan en una sola fila por caso.
  const victimas = Number(
    (
      await pool.query(
        `SELECT count(*)::int AS n FROM victima v
         JOIN caso_reportado c ON c.id = v.caso_reportado_id WHERE c.fuente_id = 'rnfja'`,
      )
    ).rows[0].n,
  );
  assert.equal(victimas, tras1, 'una víctima por caso, sin duplicar al recargar');
});

maybe(
  'carga de referencia (snic) y es idempotente, incluido el total país (jurisdiccion NULL)',
  async () => {
    const mod = getReferenceSource('snic')!;
    const res = runReferenceSource(mod, { dir: './fixtures/snic' });
    const payload = asJson(res);
    assert.ok(payload.series.length > 0, 'el fixture debe producir series');

    const s1 = await loadReferencia(pool, payload);
    // El loader reporta los puntos procesados (lo que trae el payload).
    assert.equal(s1.serie_agregada, payload.series.length);

    const count = async (where = '') =>
      Number(
        (
          await pool.query(
            `SELECT count(*)::int AS n FROM serie_agregada WHERE fuente_id = 'snic' ${where}`,
          )
        ).rows[0].n,
      );
    // Filas DISTINTAS tras la primera carga (puede ser < payload.length si la
    // fuente trae dos puntos con la misma clave natural: el UPSERT los colapsa).
    const tras1 = await count();
    const totalPais1 = await count('AND jurisdiccion IS NULL');
    assert.ok(totalPais1 > 0, 'el fixture incluye al menos un punto de total país');

    // Idempotencia: recargar la misma publicación no cambia los conteos.
    await loadReferencia(pool, payload);
    assert.equal(await count(), tras1, 'recargar no duplica serie_agregada (NULLS NOT DISTINCT)');
    assert.equal(
      await count('AND jurisdiccion IS NULL'),
      totalPais1,
      'el total país (jurisdiccion NULL) tampoco se duplica al recargar',
    );
  },
);
