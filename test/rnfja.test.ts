// test/rnfja.test.ts
// Test golden del adaptador RNFJA contra el fixture sintético.
// Corré `npm run fixture` antes (o `npm test` que asume el fixture generado).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/sources/index.js';
import { getSource } from '../src/core/registry.js';
import { runSource } from '../src/core/pipeline.js';
import { reconciliar } from '../src/reconcile/cluster.js';

const mod = getSource('rnfja')!;
const res = runSource(mod, { dir: './fixtures/rnfja-2024', anio: '2024' });

test('produce 1 caso_reportado por víctima', () => {
  assert.equal(res.casos.length, 5); // C001 tiene 2 víctimas -> 5 en total
});

test('captura víctima trans/travesti (subregistro clave)', () => {
  const trans = res.casos.filter((c) => c.victima.identidad === 'mujer_trans_travesti');
  assert.equal(trans.length, 1);
});

test('preserva la clasificación de la fuente literal', () => {
  const vinc = res.casos.find((c) => c.caso_reportado.clasificacion_fuente.includes('vinculado'));
  assert.ok(vinc, 'debe existir el caso vinculado con su etiqueta original');
});

test('deriva tipología UNODC del vínculo', () => {
  const tipos = new Set(res.casos.map((c) => c.caso_reportado.tipologia_unodc));
  assert.ok(tipos.has('intimo_pareja'));
});

test('no descarta valores en silencio: el lugar inválido genera warning', () => {
  const w = res.resumen_warnings.find((x) => x.campo === 'hecho.lugar');
  assert.ok(w, 'el lugar fuera de vocabulario debe aparecer en warnings');
});

test('pasa la validación de conformidad sin errores', () => {
  assert.equal(res.validacion.errores, 0);
});

test('reconciliación no fusiona: cada afirmación sigue contable', () => {
  const clusters = reconciliar(res.casos);
  const miembros = clusters.reduce((n, c) => n + c.miembros.length, 0);
  assert.equal(miembros, res.casos.length);
});
