// sources/aqsnv/source.ts
// Envuelve el adaptador de Ahora Que Sí Nos Ven en la interfaz SourceModule
// y lo registra. Fuente de tabla única (monitoreo de medios), lectura
// CSV/XLSX. Equipo interdisciplinario con mirada legal (abogadas en el
// equipo), por lo que los campos de respuesta_estatal tienen buena cobertura.

import { registerSource, type SourceModule, type SourceInput } from '../../core/registry.js';
import { readSheet, findFile } from '../../core/io.js';
import type { Publicacion } from '../../schema.js';
import type { RawRow } from '../../core/harmonize.js';
import { adaptAqsnv } from './adapter.js';
import { AQSNV_FUENTE, FILE_PATTERNS } from './mapping.js';

interface AqsnvRaw {
  rows: RawRow[];
}

const aqsnv: SourceModule<AqsnvRaw> = {
  meta: AQSNV_FUENTE,

  publicacionPorDefecto(input: SourceInput): Publicacion {
    return {
      fuente_id: AQSNV_FUENTE.id,
      periodo_inicio: `${input.anio}-01-01`,
      periodo_fin: `${input.anio}-12-31`,
      fecha_publicacion: `${input.anio}-12-31`,
      version: `aqsnv-${input.anio}`,
      formato: 'csv',
    };
  },

  extract(input: SourceInput): AqsnvRaw {
    const f = findFile(input.dir, FILE_PATTERNS.casos);
    if (!f) {
      throw new Error(
        `AQSNV: no se encontró archivo de registro en ${input.dir}. ` +
          `Buscado con patrón: ${FILE_PATTERNS.casos}`,
      );
    }
    const rows = readSheet(f);
    if (rows.length === 0) {
      throw new Error(`AQSNV: archivo vacío: ${f}`);
    }
    return { rows };
  },

  normalize(raw: AqsnvRaw, publicacion: Publicacion) {
    return adaptAqsnv({ rows: raw.rows, publicacion });
  },
};

registerSource(aqsnv);
