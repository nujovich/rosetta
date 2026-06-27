// test/rnfja-sentencias.test.ts
// Test golden del adaptador del Observatorio de Sentencias (OM-CSJN, issue #3)
// contra el fixture sintético. Corré `npm run fixture:rnfja-sentencias` antes
// (o `npm test`, que asume el fixture ya generado).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/sources/index.js';
import { getSource } from '../src/core/registry.js';
import { runSource } from '../src/core/pipeline.js';
import { reconciliar } from '../src/reconcile/cluster.js';

const mod = getSource('rnfja-sentencias')!;
const res = runSource(mod, { dir: './fixtures/rnfja-sentencias-2024', anio: '2024' });

test('produce 1 caso_reportado por causa', () => {
  assert.equal(res.casos.length, 5);
});

test('captura el desenlace judicial: condenas con su pena', () => {
  const condenas = res.casos.filter((c) => c.respuesta_estatal.hubo_condena === true);
  assert.equal(condenas.length, 2);
  assert.ok(
    condenas.every((c) => c.respuesta_estatal.pena != null),
    'toda condena del fixture trae pena',
  );
});

test('distingue sentencia firme absolutoria de condenatoria', () => {
  // S002: estado sentencia_firme PERO hubo_condena=false (absolución).
  const absuelta = res.casos.find(
    (c) =>
      c.respuesta_estatal.estado_causa === 'sentencia_firme' &&
      c.respuesta_estatal.hubo_condena === false,
  );
  assert.ok(absuelta, 'debe existir una sentencia firme sin condena');
});

test('registra fecha de sentencia cuando hay sentencia', () => {
  const conSentencia = res.casos.filter((c) => c.respuesta_estatal.fecha_sentencia != null);
  assert.equal(conSentencia.length, 3);
});

test('mapea estados procesales al vocabulario canónico', () => {
  const estados = new Set(res.casos.map((c) => c.respuesta_estatal.estado_causa));
  assert.ok(estados.has('sentencia_firme'));
  assert.ok(estados.has('sentencia_no_firme'));
  assert.ok(estados.has('etapa_juicio'));
  assert.ok(estados.has('etapa_investigacion'));
});

test('marca el agravante de femicidio (art. 80 inc. 11) por definición de la fuente', () => {
  assert.ok(res.casos.every((c) => c.respuesta_estatal.agravante_80_inc11 === true));
});

test('captura víctima trans/travesti', () => {
  const trans = res.casos.filter((c) => c.victima.identidad === 'mujer_trans_travesti');
  assert.equal(trans.length, 1);
});

test('no descarta valores en silencio: resultado inválido genera warning', () => {
  const w = res.resumen_warnings.find((x) => x.campo === 'respuesta_estatal.hubo_condena');
  assert.ok(w, 'el resultado fuera de vocabulario debe aparecer en warnings');
});

test('pasa la validación de conformidad sin errores', () => {
  assert.equal(res.validacion.errores, 0);
});

test('reconciliación no fusiona: cada afirmación sigue contable', () => {
  const clusters = reconciliar(res.casos);
  const miembros = clusters.reduce((n, c) => n + c.miembros.length, 0);
  assert.equal(miembros, res.casos.length);
});
