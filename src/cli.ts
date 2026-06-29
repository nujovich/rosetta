// cli.ts
// Uso:
//   npm run dev -- list
//   npm run dev -- run rnfja --dir ./fixtures/rnfja-2024 --anio 2024 --out ./out/rnfja-2024.json
//   npm run dev -- run-ref snic --dir ./fixtures/snic --out ./out/snic.json
//   npm run dev -- migrate                       (aplica db/migrations a DATABASE_URL)
//   npm run dev -- load ./out/rnfja-2024.json    (carga una salida del pipeline)
//
// El CLI sólo conoce los registries (per-case y referencia). Agregar una
// fuente NO toca este archivo.

import * as fs from 'node:fs';
import * as path from 'node:path';
import './sources/index.js'; // registra todas las fuentes
import { listSources, getSource } from './core/registry.js';
import { runSource } from './core/pipeline.js';
import { listReferenceSources, getReferenceSource, runReferenceSource } from './core/reference.js';

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

function cmdList() {
  console.log('\n  Fuentes per-case (producen caso_reportado):');
  for (const m of listSources()) {
    const unodc = m.alineado_unodc ? '✓ UNODC' : '· s/alinear';
    console.log(`   ${m.id.padEnd(16)} ${m.metodo.padEnd(22)} ${unodc}  ${m.nombre}`);
  }
  const refs = listReferenceSources();
  if (refs.length) {
    console.log('\n  Fuentes de referencia (agregadas, validación cruzada — NO per-case):');
    for (const m of refs) {
      console.log(`   ${m.id.padEnd(16)} ${m.metodo.padEnd(22)} ⌁ agregada  ${m.nombre}`);
    }
  }
  console.log('');
}

function cmdRun() {
  const id = process.argv[3];
  const dir = arg('dir');
  const anio = arg('anio') ?? String(new Date().getFullYear() - 1);
  const out = arg('out') ?? `./out/${id}-${anio}.json`;
  const mod = getSource(id);
  if (!mod) {
    console.error(`Fuente desconocida: ${id}. Probá "list".`);
    process.exit(1);
  }
  if (!dir) {
    console.error('Falta --dir');
    process.exit(1);
  }

  let res;
  try {
    res = runSource(mod, { dir, anio });
  } catch (e) {
    console.error(`\n  ✗ ${(e as Error).message}\n`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(res, null, 2), 'utf8');

  console.log(`\n  ${res.fuente.nombre}`);
  console.log(`  ${anio} -> ${out}`);
  console.log('  ─────────────────────────────────');
  console.log(
    `  entrada:  ${Object.entries(res.stats)
      .map(([k, v]) => `${v} ${k}`)
      .join(' · ')}`,
  );
  console.log(`  salida:   ${res.casos.length} caso_reportado`);

  const por = (f: (c: any) => string) =>
    res!.casos.reduce<Record<string, number>>((a, c) => {
      const k = f(c);
      a[k] = (a[k] ?? 0) + 1;
      return a;
    }, {});
  console.log(
    '  identidad:',
    por((c) => c.victima.identidad),
  );
  console.log(
    '  tipología:',
    por((c) => c.caso_reportado.tipologia_unodc),
  );

  console.log(`  validación: ${res.validacion.errores} errores · ${res.validacion.avisos} avisos`);
  if (res.validacion.errores) {
    for (const i of res.validacion.issues.filter((x) => x.nivel === 'error').slice(0, 10))
      console.log(`     ✗ ${i.campo}: ${i.detalle} [${i.id_externo}]`);
  }

  if (res.resumen_warnings.length) {
    console.log(`  ⚠️ ${res.warnings.length} valores sin mapear (gaps vs. Libro de Códigos):`);
    for (const w of res.resumen_warnings.slice(0, 12))
      console.log(`     ${w.campo} ← "${w.valor_crudo}" (x${w.n})`);
  } else {
    console.log('  ✓ sin valores sin mapear');
  }
  console.log('');
}

function cmdRunRef() {
  const id = process.argv[3];
  const dir = arg('dir');
  const anio = arg('anio');
  const out = arg('out') ?? `./out/${id}.json`;
  const mod = getReferenceSource(id);
  if (!mod) {
    console.error(`Fuente de referencia desconocida: ${id}. Probá "list".`);
    process.exit(1);
  }
  if (!dir) {
    console.error('Falta --dir');
    process.exit(1);
  }

  let res;
  try {
    res = runReferenceSource(mod, { dir, anio });
  } catch (e) {
    console.error(`\n  ✗ ${(e as Error).message}\n`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(res, null, 2), 'utf8');

  console.log(`\n  ${res.fuente.nombre}`);
  console.log(`  serie agregada -> ${out}`);
  console.log('  ─────────────────────────────────');
  console.log(`  ⌁ NO produce caso_reportado: ${res.fuente.no_apto_caso_reportado}`);
  console.log(
    `  entrada:  ${Object.entries(res.stats)
      .map(([k, v]) => `${v} ${k}`)
      .join(' · ')}`,
  );
  console.log(`  salida:   ${res.series.length} puntos de serie (${res.fuente.unidad})`);
  console.log(`  validación: ${res.validacion.errores} errores · ${res.validacion.avisos} avisos`);
  if (res.resumen_warnings.length) {
    console.log(`  ⚠️ ${res.warnings.length} valores sin mapear:`);
    for (const w of res.resumen_warnings.slice(0, 12))
      console.log(`     ${w.campo} ← "${w.valor_crudo}" (x${w.n})`);
  } else {
    console.log('  ✓ sin valores sin mapear');
  }
  console.log('');
}

// ---- Etapa de carga (load) a Postgres ----
// El loader vive aparte (src/load/) y se importa de forma perezosa para que el
// CLI no exija `pg` ni DATABASE_URL salvo que se use `migrate`/`load`.

async function cmdMigrate() {
  const { createPool } = await import('./load/db.js');
  const { migrate } = await import('./load/migrate.js');
  const pool = createPool();
  try {
    const r = await migrate(pool);
    console.log('\n  Migraciones');
    console.log('  ─────────────────────────────────');
    if (r.aplicadas.length) for (const f of r.aplicadas) console.log(`  ✓ aplicada  ${f}`);
    if (r.yaAplicadas.length) for (const f of r.yaAplicadas) console.log(`  · ya estaba ${f}`);
    if (!r.aplicadas.length) console.log('  (nada nuevo que aplicar)');
    console.log('');
  } finally {
    await pool.end();
  }
}

async function cmdLoad() {
  const file = process.argv[3];
  if (!file) {
    console.error('Falta el archivo: load <salida-del-pipeline.json>');
    process.exit(1);
  }
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { createPool } = await import('./load/db.js');
  const { loadPayload } = await import('./load/load.js');
  const pool = createPool();
  try {
    const s = await loadPayload(pool, payload);
    console.log(`\n  Carga: ${path.basename(file)} -> Postgres`);
    console.log('  ─────────────────────────────────');
    console.log(`  fuente:       ${s.fuente}`);
    console.log(`  publicación:  ${s.publicacion}`);
    if (s.caso_reportado) console.log(`  cargados:     ${s.caso_reportado} caso_reportado`);
    if (s.serie_agregada)
      console.log(`  cargados:     ${s.serie_agregada} puntos de serie_agregada`);
    console.log('  ✓ idempotente: recargar la misma publicación actualiza, no duplica.');
    console.log('');
  } finally {
    await pool.end();
  }
}

const cmd = process.argv[2];
if (cmd === 'list') cmdList();
else if (cmd === 'run') cmdRun();
else if (cmd === 'run-ref') cmdRunRef();
else if (cmd === 'migrate') cmdMigrate().catch(fatal);
else if (cmd === 'load') cmdLoad().catch(fatal);
else {
  console.log(
    'Comandos:\n' +
      '  list\n' +
      '  run <fuente> --dir <d> --anio <a> [--out <f>]\n' +
      '  run-ref <fuente-referencia> --dir <d> [--anio <a>] [--out <f>]\n' +
      '  migrate                       (aplica db/migrations a DATABASE_URL)\n' +
      '  load <salida-del-pipeline.json>  (carga per-case o referencia a Postgres)',
  );
}

function fatal(e: unknown): never {
  console.error(`\n  ✗ ${(e as Error).message}\n`);
  process.exit(1);
}
