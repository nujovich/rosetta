// core/reference.ts
// Soporte para FUENTES DE REFERENCIA (agregadas), distintas de las fuentes
// per-case. Algunas fuentes —como el SNIC— publican SOLO datos agregados
// (tasas por provincia/año), no casos individuales. Forzarlas al modelo
// `caso_reportado` violaría el principio del proyecto: nunca se inventan casos
// ni un total propio (ver docs/estandar-v0.1.md §1 y §6 y las reglas de
// dignidad del dato). Por eso producen `SerieAgregada`, no `CasoReportado`.
//
// Su valor es de VALIDACIÓN CRUZADA: contrastar la tasa oficial de una
// jurisdicción contra lo que captan las fuentes per-case. No alimentan el
// conteo per-case ni la reconciliación; viven en un registry paralelo.

import type { Publicacion } from '../schema.js';
import type { WarningSink } from './harmonize.js';

// Una observación agregada: el valor de un indicador para una jurisdicción y
// un año (ej: tasa de homicidios dolosos cada 100.000 hab. en Salta, 2021).
export interface SerieAgregada {
  fuente_id: string;
  indicador: string; // ej: 'tasa_homicidios_dolosos'
  unidad: string; // ej: 'tasa_100k'
  jurisdiccion: string | null; // provincia canónica (null = total país / sin mapear)
  anio: number;
  valor: number | null; // null = sin dato para ese punto
  categoria: string | null; // categoría penal / sub-serie de la fuente, si aplica
}

export interface ReferenceMeta {
  id: string;
  nombre: string;
  tipo: string; // tipo_fuente (texto: este registry no produce caso_reportado)
  metodo: string; // metodo_recoleccion (texto)
  definicion_base: string;
  indicador: string;
  unidad: string;
  alcance_categorias: string[];
  cita_obligatoria?: string;
  // Marca explícita: esta fuente NO produce casos. Documenta el porqué.
  no_apto_caso_reportado: string;
}

export interface ReferenceInput {
  dir: string;
  anio?: string; // opcional: las series suelen ser multi-anuales
  publicacion?: Publicacion;
}

export interface ReferenceResult {
  series: SerieAgregada[];
  warnings: ReturnType<WarningSink['all']>;
  resumen_warnings: ReturnType<WarningSink['resumen']>;
  stats: Record<string, number>;
}

export interface ReferenceModule<Raw = unknown> {
  meta: ReferenceMeta;
  publicacionPorDefecto(input: ReferenceInput): Publicacion;
  extract(input: ReferenceInput): Raw;
  normalize(raw: Raw, publicacion: Publicacion): ReferenceResult;
}

// ---- Registry paralelo (no se mezcla con el de caso_reportado) ----

const REF_REGISTRY = new Map<string, ReferenceModule<any>>();

export function registerReferenceSource(mod: ReferenceModule<any>): void {
  if (REF_REGISTRY.has(mod.meta.id)) {
    throw new Error(`Fuente de referencia duplicada en el registry: ${mod.meta.id}`);
  }
  REF_REGISTRY.set(mod.meta.id, mod);
}

export function getReferenceSource(id: string): ReferenceModule<any> | undefined {
  return REF_REGISTRY.get(id);
}

export function listReferenceSources(): ReferenceMeta[] {
  return [...REF_REGISTRY.values()].map((m) => m.meta);
}

// ---- Validación de conformidad para series agregadas ----
// Análoga a core/validate.ts pero para el modelo agregado: distingue ERRORES
// (rompen) de AVISOS (señales de calidad que no invalidan).

export interface SerieIssue {
  nivel: 'error' | 'aviso';
  campo: string;
  detalle: string;
  contexto: string;
}

export interface SerieValidationReport {
  total: number;
  errores: number;
  avisos: number;
  issues: SerieIssue[];
}

export function validateSerie(s: SerieAgregada): SerieIssue[] {
  const out: SerieIssue[] = [];
  const ctx = `${s.jurisdiccion ?? 'país'}/${s.anio}`;

  if (!Number.isInteger(s.anio) || s.anio < 1900 || s.anio > 2100) {
    out.push({
      nivel: 'error',
      campo: 'anio',
      detalle: `año implausible: ${s.anio}`,
      contexto: ctx,
    });
  }
  if (s.valor != null && (!Number.isFinite(s.valor) || s.valor < 0)) {
    out.push({
      nivel: 'error',
      campo: 'valor',
      detalle: `valor implausible: ${s.valor}`,
      contexto: ctx,
    });
  }
  if (!s.indicador) {
    out.push({ nivel: 'error', campo: 'indicador', detalle: 'indicador vacío', contexto: ctx });
  }
  if (s.jurisdiccion == null) {
    out.push({
      nivel: 'aviso',
      campo: 'jurisdiccion',
      detalle: 'jurisdicción sin mapear (se computa como total país / sin asignar)',
      contexto: ctx,
    });
  }
  if (s.valor == null) {
    out.push({ nivel: 'aviso', campo: 'valor', detalle: 'punto sin dato', contexto: ctx });
  }
  return out;
}

export function validateSeries(series: SerieAgregada[]): SerieValidationReport {
  const issues = series.flatMap(validateSerie);
  return {
    total: series.length,
    errores: issues.filter((i) => i.nivel === 'error').length,
    avisos: issues.filter((i) => i.nivel === 'aviso').length,
    issues,
  };
}

export interface ReferencePipelineResult extends ReferenceResult {
  fuente: ReferenceMeta;
  publicacion: Publicacion;
  validacion: SerieValidationReport;
}

// Orquesta extract -> normalize -> validate para una fuente de referencia.
// Paralelo a pipeline.runSource pero sobre el modelo agregado.
export function runReferenceSource(
  mod: ReferenceModule<any>,
  input: ReferenceInput,
): ReferencePipelineResult {
  const publicacion = input.publicacion ?? mod.publicacionPorDefecto(input);
  const raw = mod.extract(input);
  const norm = mod.normalize(raw, publicacion);
  const validacion = validateSeries(norm.series);
  return { fuente: mod.meta, publicacion, ...norm, validacion };
}
