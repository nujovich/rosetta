// sources/snic/adapter.ts
// Toma las filas de la serie del SNIC (tasas por provincia/año) y produce
// SerieAgregada[]. NO produce caso_reportado: el SNIC publica agregados, no
// hechos individuales. El aporte es de validación cruzada provincial.

import type { Publicacion } from '../../schema.js';
import type { ReferenceResult, SerieAgregada } from '../../core/reference.js';
import {
  RawRow,
  WarningSink,
  pick,
  isNull,
  normalizeLabel,
  toISODate,
} from '../../core/harmonize.js';
import { SNIC_FUENTE, COLS, normalizarProvincia } from './mapping.js';

export interface SnicInput {
  rows: RawRow[];
  publicacion: Publicacion;
}

export interface SnicOutput extends ReferenceResult {
  fuente: typeof SNIC_FUENTE;
  publicacion: Publicacion;
  stats: {
    filas: number;
    series_producidas: number;
    provincias_distintas: number;
    total_pais: number;
    sin_dato: number;
  };
}

// La serie de datos.gob.ar trae el tiempo como 'indice_tiempo' (una fecha);
// otras exportaciones traen el año pelado. Además, al leer la planilla las
// fechas pueden venir reformateadas (ej. '1/1/22'), así que probamos: año de
// 4 dígitos -> fecha parseable -> nada.
function parseAnio(raw: unknown): number | null {
  if (isNull(raw)) return null;
  const s = String(raw);
  const m4 = s.match(/(?:^|[^0-9])(\d{4})(?:[^0-9]|$)/);
  if (m4) return Number(m4[1]);
  const iso = toISODate(s);
  return iso ? Number(iso.slice(0, 4)) : null;
}

function parseValor(raw: unknown): number | null {
  if (isNull(raw)) return null;
  const n = Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function adaptSnic(input: SnicInput): SnicOutput {
  const warn = new WarningSink(SNIC_FUENTE.id);
  const series: SerieAgregada[] = [];
  const provincias = new Set<string>();
  let totalPais = 0;
  let sinDato = 0;

  input.rows.forEach((row, idx) => {
    const ctx = `fila#${idx}`;

    const anio = parseAnio(pick(row, COLS.anio));
    if (anio == null) {
      // sin año no se puede ubicar el punto en la serie: warning y se saltea.
      warn.add('anio', pick(row, COLS.anio) ?? '(vacío)', ctx);
      return;
    }

    const prov = normalizarProvincia(pick(row, COLS.jurisdiccion));
    if (!prov.reconocida) {
      warn.add('jurisdiccion', pick(row, COLS.jurisdiccion) ?? '(vacío)', ctx);
    }
    if (prov.es_total_pais) totalPais++;
    if (prov.jurisdiccion) provincias.add(prov.jurisdiccion);

    const valor = parseValor(pick(row, COLS.valor));
    if (valor == null) sinDato++;

    const categoriaRaw = pick(row, COLS.categoria);
    const categoria = isNull(categoriaRaw) ? null : String(categoriaRaw).trim();

    series.push({
      fuente_id: SNIC_FUENTE.id,
      indicador: SNIC_FUENTE.indicador,
      unidad: SNIC_FUENTE.unidad,
      jurisdiccion: prov.jurisdiccion,
      anio,
      valor,
      categoria: categoria && normalizeLabel(categoria) ? categoria : null,
    });
  });

  return {
    fuente: SNIC_FUENTE,
    publicacion: input.publicacion,
    series,
    warnings: warn.all(),
    resumen_warnings: warn.resumen(),
    stats: {
      filas: input.rows.length,
      series_producidas: series.length,
      provincias_distintas: provincias.size,
      total_pais: totalPais,
      sin_dato: sinDato,
    },
  };
}
