// sources/lucia-perez/source.ts
// Envuelve el adaptador del Observatorio Lucía Pérez en la interfaz
// SourceModule y lo registra. Fuente de tabla única (padrón), lectura CSV.

import { registerSource, type SourceModule, type SourceInput } from '../../core/registry.js';
import { readSheet, findFile } from '../../core/io.js';
import type { Publicacion } from '../../schema.js';
import type { RawRow } from '../../core/harmonize.js';
import { adaptLuciaPerez } from './adapter.js';
import { LUCIA_PEREZ_FUENTE, FILE_PATTERNS } from './mapping.js';

interface LuciaPerezRaw {
  rows: RawRow[];
}

const luciaPerez: SourceModule<LuciaPerezRaw> = {
  meta: LUCIA_PEREZ_FUENTE,

  publicacionPorDefecto(input: SourceInput): Publicacion {
    return {
      fuente_id: LUCIA_PEREZ_FUENTE.id,
      periodo_inicio: `${input.anio}-01-01`,
      periodo_fin: `${input.anio}-12-31`,
      fecha_publicacion: `${input.anio}-12-31`,
      version: `lp-${input.anio}`,
      formato: 'csv',
    };
  },

  extract(input: SourceInput): LuciaPerezRaw {
    const f = findFile(input.dir, FILE_PATTERNS.casos);
    if (!f) {
      throw new Error(
        `Lucía Pérez: no se encontró archivo de padrón en ${input.dir}. ` +
          `Buscado con patrón: ${FILE_PATTERNS.casos}`,
      );
    }
    const rows = readSheet(f);
    if (rows.length === 0) {
      throw new Error(`Lucía Pérez: archivo vacío: ${f}`);
    }
    return { rows };
  },

  normalize(raw: LuciaPerezRaw, publicacion: Publicacion) {
    return adaptLuciaPerez({ rows: raw.rows, publicacion });
  },
};

registerSource(luciaPerez);
