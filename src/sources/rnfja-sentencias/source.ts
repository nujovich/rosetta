// sources/rnfja-sentencias/source.ts
// Envuelve el adaptador del Observatorio de Sentencias (OM-CSJN) en la
// interfaz SourceModule y lo registra. Tabla única (.xls/.sav/.csv), reutiliza
// io.ts igual que el RNFJA. Es la variante "desenlace judicial" del RNFJA.

import { registerSource, type SourceModule, type SourceInput } from '../../core/registry.js';
import { readSheet, findFile } from '../../core/io.js';
import type { Publicacion } from '../../schema.js';
import type { RawRow } from '../../core/harmonize.js';
import { adaptRnfjaSentencias } from './adapter.js';
import { RNFJA_SENTENCIAS_FUENTE, FILE_PATTERNS } from './mapping.js';

interface RnfjaSentenciasRaw {
  rows: RawRow[];
}

const rnfjaSentencias: SourceModule<RnfjaSentenciasRaw> = {
  meta: RNFJA_SENTENCIAS_FUENTE,

  publicacionPorDefecto(input: SourceInput): Publicacion {
    return {
      fuente_id: RNFJA_SENTENCIAS_FUENTE.id,
      periodo_inicio: `${input.anio}-01-01`,
      periodo_fin: `${input.anio}-12-31`,
      fecha_publicacion: `${input.anio}-12-31`,
      version: `om-csjn-sentencias-${input.anio}`,
      formato: 'xls',
    };
  },

  extract(input: SourceInput): RnfjaSentenciasRaw {
    const f = findFile(input.dir, FILE_PATTERNS.causas);
    if (!f) {
      throw new Error(
        `RNFJA-Sentencias: no se encontró base de seguimiento en ${input.dir}. ` +
          `Buscado con patrón: ${FILE_PATTERNS.causas}`,
      );
    }
    const rows = readSheet(f);
    if (rows.length === 0) {
      throw new Error(`RNFJA-Sentencias: archivo vacío: ${f}`);
    }
    return { rows };
  },

  normalize(raw: RnfjaSentenciasRaw, publicacion: Publicacion) {
    return adaptRnfjaSentencias({ rows: raw.rows, publicacion });
  },
};

registerSource(rnfjaSentencias);
export default rnfjaSentencias;
