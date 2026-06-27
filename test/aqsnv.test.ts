// test/aqsnv.test.ts
// Test golden del adaptador AQSNV contra el fixture sintético.
// npm run fixture:aqsnv  (o npm test que asume el fixture generado).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/sources/index.js';
import { getSource } from '../src/core/registry.js';
import { runSource } from '../src/core/pipeline.js';
import { reconciliar } from '../src/reconcile/cluster.js';

const mod = getSource('aqsnv')!;
const res = runSource(mod, { dir: './fixtures/aqsnv-2024', anio: '2024' });

test('produce 1 caso_reportado por víctima', () => {
  assert.equal(res.casos.length, 5);
});

test('captura víctima trans/travesti (subregistro clave)', () => {
  const trans = res.casos.filter(
    (c) => c.victima.identidad === 'mujer_trans_travesti',
  );
  assert.equal(trans.length, 1);
});

test('clasificacion_fuente incluye Travesticidio e Instigacion al suicidio', () => {
  const tv = res.casos.find((c) =>
    c.caso_reportado.clasificacion_fuente.toLowerCase().includes('travesticidio'),
  );
  const is = res.casos.find((c) =>
    c.caso_reportado.clasificacion_fuente.includes('Instigación'),
  );
  assert.ok(tv, 'debe existir travesticidio');
  assert.ok(is, 'debe existir instigación al suicidio');
});

test('deriva tipología UNODC del vínculo', () => {
  const tipos = new Set(res.casos.map((c) => c.caso_reportado.tipologia_unodc));
  assert.ok(tipos.has('intimo_pareja'));
  assert.ok(tipos.has('familiar'));
  assert.ok(tipos.has('otro'));
});

test('registra hijos a cargo (huérfanos por femicidio)', () => {
  const conHijos = res.casos.filter((c) => (c.victima.hijos_a_cargo ?? 0) > 0);
  assert.ok(conHijos.length >= 2, 'debe haber al menos 2 casos con hijos');
});

test('captura denuncias previas cuando existen', () => {
  const conDenuncia = res.casos.filter(
    (c) => c.sujetos_activos[0]?.denuncias_previas === true,
  );
  assert.ok(conDenuncia.length >= 2, 'debe haber al menos 2 casos con denuncias');
});

test('captura medida de protección vigente (perimetral)', () => {
  const conProteccion = res.casos.filter(
    (c) => c.sujetos_activos[0]?.medida_proteccion_vigente === true,
  );
  assert.ok(conProteccion.length >= 1, 'debe haber al menos 1 caso con perimetral');
});

test('registra carátula judicial cuando existe', () => {
  const conCaratula = res.casos.filter(
    (c) => c.respuesta_estatal.caratula_judicial != null,
  );
  assert.ok(conCaratula.length >= 3, 'debe haber al menos 3 casos con carátula');
});

test('pasa la validación de conformidad sin errores', () => {
  assert.equal(res.validacion.errores, 0);
});

test('reconciliación no fusiona: cada afirmación sigue contable', () => {
  const clusters = reconciliar(res.casos);
  const miembros = clusters.reduce((n, c) => n + c.miembros.length, 0);
  assert.equal(miembros, res.casos.length);
});