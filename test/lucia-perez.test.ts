// test/lucia-perez.test.ts
// Test golden del adaptador Lucía Pérez contra el fixture sintético.
// npm run fixture:lucia-perez  (o npm test que asume el fixture generado).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/sources/index.js';
import { getSource } from '../src/core/registry.js';
import { runSource } from '../src/core/pipeline.js';
import { reconciliar } from '../src/reconcile/cluster.js';

const mod = getSource('lucia-perez')!;
const res = runSource(mod, { dir: './fixtures/lucia-perez-2024', anio: '2024' });

test('produce 1 caso_reportado por víctima', () => {
  assert.equal(res.casos.length, 4);
});

test('captura víctima trans/travesti (subregistro clave)', () => {
  const trans = res.casos.filter((c) => c.victima.identidad === 'mujer_trans_travesti');
  assert.equal(trans.length, 1);
});

test('clasificacion_fuente incluye travesticidio', () => {
  const tv = res.casos.find((c) =>
    c.caso_reportado.clasificacion_fuente.toLowerCase().includes('travesticidio'),
  );
  assert.ok(tv, 'debe existir el caso travesticidio con su etiqueta original');
});

test('deriva tipología UNODC del vínculo (pareja → intimo_pareja)', () => {
  const tipos = new Set(res.casos.map((c) => c.caso_reportado.tipologia_unodc));
  assert.ok(tipos.has('intimo_pareja'));
  assert.ok(tipos.has('familiar'));
  assert.ok(tipos.has('otro'));
});

test('registra hijos a cargo (huérfanos por femicidio)', () => {
  const conHijos = res.casos.filter((c) => (c.victima.hijos_a_cargo ?? 0) > 0);
  assert.ok(conHijos.length > 0, 'debe haber al menos un caso con hijos a cargo');
});

test('captura denuncias previas cuando existen', () => {
  const conDenuncia = res.casos.filter((c) => c.sujetos_activos[0]?.denuncias_previas === true);
  assert.ok(conDenuncia.length > 0, 'debe haber al menos un caso con denuncias previas');
});

test('incluye carátula judicial cuando está disponible', () => {
  const conCaratula = res.casos.filter((c) => c.respuesta_estatal.caratula_judicial != null);
  assert.ok(conCaratula.length > 0, 'debe haber al menos un caso con carátula judicial');
});

test('no descarta valores en silencio: medio inválido genera warning', () => {
  const w = res.resumen_warnings.find((x) => x.campo === 'hecho.medio');
  assert.ok(w, 'el medio fuera de vocabulario debe aparecer en warnings');
});

test('pasa la validación de conformidad sin errores', () => {
  assert.equal(res.validacion.errores, 0);
});

test('reconciliación no fusiona: cada afirmación sigue contable', () => {
  const clusters = reconciliar(res.casos);
  const miembros = clusters.reduce((n, c) => n + c.miembros.length, 0);
  assert.equal(miembros, res.casos.length);
});
