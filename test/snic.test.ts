// test/snic.test.ts
// Test golden del adaptador de referencia SNIC (issue #2) contra el fixture
// sintético. El SNIC NO produce caso_reportado: produce SerieAgregada (tasas
// por provincia/año) para validación cruzada. Corré `npm run fixture:snic`
// antes (o `npm test`, que asume el fixture ya generado).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/sources/index.js';
import { getReferenceSource, runReferenceSource } from '../src/core/reference.js';
import { getSource } from '../src/core/registry.js';

const mod = getReferenceSource('snic')!;
const res = runReferenceSource(mod, { dir: './fixtures/snic' });

test('se registra como fuente de referencia, NO como caso_reportado', () => {
  assert.ok(mod, 'snic debe estar en el registry de referencia');
  // Y no debe estar en el registry per-case (no produce casos).
  assert.equal(getSource('snic'), undefined);
});

test('produce series agregadas (tasa por provincia/año), no casos', () => {
  assert.ok(res.series.length >= 18, 'debe haber al menos 18 puntos de serie');
  assert.ok(
    res.series.every((s) => s.unidad === 'tasa_100k' && s.indicador === 'tasa_homicidios_dolosos'),
  );
});

test('normaliza nombres de provincia al canónico', () => {
  const caba = res.series.find((s) => s.jurisdiccion === 'Ciudad Autónoma de Buenos Aires');
  assert.ok(caba, 'CABA debe normalizarse al nombre canónico');
  assert.equal(res.stats.provincias_distintas, 5);
});

test('el total país queda con jurisdicción null y sin warning', () => {
  const totales = res.series.filter((s) => s.jurisdiccion === null && s.valor != null);
  assert.ok(totales.length >= 3, 'deben existir los puntos de total país');
  const warnTotal = res.resumen_warnings.find((w) => w.valor_crudo.toLowerCase().includes('total'));
  assert.equal(warnTotal, undefined, 'el total país no debe generar warning');
});

test('no descarta en silencio: provincia desconocida genera warning', () => {
  const w = res.resumen_warnings.find((x) => x.campo === 'jurisdiccion');
  assert.ok(w, 'la provincia no reconocida debe aparecer en warnings');
});

test('preserva puntos sin dato como valor null (aviso, no error)', () => {
  assert.ok(res.stats.sin_dato >= 1, 'debe haber al menos un punto sin dato');
  const avisoSinDato = res.validacion.issues.find(
    (i) => i.campo === 'valor' && i.nivel === 'aviso',
  );
  assert.ok(avisoSinDato, 'el punto sin dato debe ser un aviso');
});

test('pasa la validación de conformidad agregada sin errores', () => {
  assert.equal(res.validacion.errores, 0);
});
