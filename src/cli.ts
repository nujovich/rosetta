// cli.ts
// Uso:
//   npm run dev -- list
//   npm run dev -- run rnfja --dir ./fixtures/rnfja-2024 --anio 2024 --out ./out/rnfja-2024.json
//
// El CLI sólo conoce el registry. Agregar una fuente NO toca este archivo.

import * as fs from 'node:fs';
import * as path from 'node:path';
import './sources/index.js'; // registra todas las fuentes
import { listSources, getSource } from './core/registry.js';
import { runSource } from './core/pipeline.js';

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

function cmdList() {
  console.log('\n  Fuentes registradas:');
  for (const m of listSources()) {
    const unodc = m.alineado_unodc ? '✓ UNODC' : '· s/alinear';
    console.log(`   ${m.id.padEnd(8)} ${m.metodo.padEnd(20)} ${unodc}  ${m.nombre}`);
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

const cmd = process.argv[2];
if (cmd === 'list') cmdList();
else if (cmd === 'run') cmdRun();
else {
  console.log('Comandos: list | run <fuente> --dir <d> --anio <a> [--out <f>]');
}
