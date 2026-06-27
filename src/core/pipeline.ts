// core/pipeline.ts
// Orquesta las etapas para una fuente: extract -> normalize -> validate.
// (load y reconcile son etapas posteriores, separadas: ver src/reconcile/.)

import type { SourceModule, SourceInput, NormalizeResult } from './registry.js';
import type { Publicacion } from '../schema.js';
import { validateMany, type ValidationReport } from './validate.js';

export interface PipelineResult extends NormalizeResult {
  fuente: SourceModule['meta'];
  publicacion: Publicacion;
  validacion: ValidationReport;
}

export function runSource(mod: SourceModule<any>, input: SourceInput): PipelineResult {
  const publicacion = input.publicacion ?? mod.publicacionPorDefecto(input);
  const raw = mod.extract(input); // 1) extract
  const norm = mod.normalize(raw, publicacion); // 2) normalize
  const validacion = validateMany(norm.casos, publicacion); // 3) validate
  return { fuente: mod.meta, publicacion, ...norm, validacion };
}
