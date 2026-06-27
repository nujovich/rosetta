// core/registry.ts
// El backbone de "agregar adaptadores sin tocar el core".
// Cada fuente implementa SourceModule y se auto-registra. El CLI y el pipeline
// sólo conocen el registry, nunca las fuentes concretas.

import type {
  CasoReportadoCompleto,
  Publicacion,
  TipoFuente,
  MetodoRecoleccion,
} from '../schema.js';
import type { WarningSink } from './harmonize.js';

export interface SourceMeta {
  id: string;
  nombre: string;
  tipo: TipoFuente;
  metodo: MetodoRecoleccion;
  definicion_base: string;
  alcance_categorias: string[];
  alineado_unodc?: boolean;
  cita_obligatoria?: string;
}

export interface SourceInput {
  dir: string; // directorio con los archivos de la fuente
  anio: string;
  publicacion?: Publicacion;
}

export interface NormalizeResult {
  casos: CasoReportadoCompleto[];
  warnings: ReturnType<WarningSink['all']>;
  resumen_warnings: ReturnType<WarningSink['resumen']>;
  stats: Record<string, number>;
}

// Una fuente declara cómo extraer sus datos crudos y cómo normalizarlos.
// `Raw` es la forma intermedia propia de cada fuente (1 tabla, 3 tablas, etc.).
export interface SourceModule<Raw = unknown> {
  meta: SourceMeta;
  publicacionPorDefecto(input: SourceInput): Publicacion;
  extract(input: SourceInput): Raw;
  normalize(raw: Raw, publicacion: Publicacion): NormalizeResult;
}

const REGISTRY = new Map<string, SourceModule<any>>();

export function registerSource(mod: SourceModule<any>): void {
  if (REGISTRY.has(mod.meta.id)) {
    throw new Error(`Fuente duplicada en el registry: ${mod.meta.id}`);
  }
  REGISTRY.set(mod.meta.id, mod);
}

export function getSource(id: string): SourceModule<any> | undefined {
  return REGISTRY.get(id);
}

export function listSources(): SourceMeta[] {
  return [...REGISTRY.values()].map((m) => m.meta);
}
