// sources/rnfja/source.ts
// Envuelve el adaptador RNFJA en la interfaz SourceModule y lo registra.
// Esta es toda la "cola" que conecta una fuente al esqueleto.

import { registerSource, type SourceModule, type SourceInput } from '../../core/registry.js';
import { readSheet, findFile } from '../../core/io.js';
import type { Publicacion } from '../../schema.js';
import type { RawRow } from '../../core/harmonize.js';
import { adaptRnfja } from './adapter.js';
import { RNFJA_FUENTE, FILE_PATTERNS } from './mapping.js';

interface RnfjaRaw {
  causaRows: RawRow[];
  victimaRows: RawRow[];
  sujetoRows: RawRow[];
}

const rnfja: SourceModule<RnfjaRaw> = {
  meta: RNFJA_FUENTE,

  publicacionPorDefecto(input: SourceInput): Publicacion {
    return {
      fuente_id: RNFJA_FUENTE.id,
      periodo_inicio: `${input.anio}-01-01`,
      periodo_fin: `${input.anio}-12-31`,
      fecha_publicacion: `${input.anio}-12-31`,
      version: `om-csjn-${input.anio}`,
      formato: 'xls',
    };
  },

  extract(input: SourceInput): RnfjaRaw {
    const fCausa = findFile(input.dir, FILE_PATTERNS.causa);
    const fVic = findFile(input.dir, FILE_PATTERNS.victima);
    const fSuj = findFile(input.dir, FILE_PATTERNS.sujeto);
    if (!fCausa || !fVic || !fSuj) {
      throw new Error(
        `RNFJA: faltan bases en ${input.dir} ` +
          `(causa=${!!fCausa} victima=${!!fVic} sujeto=${!!fSuj})`,
      );
    }
    return {
      causaRows: readSheet(fCausa),
      victimaRows: readSheet(fVic),
      sujetoRows: readSheet(fSuj),
    };
  },

  normalize(raw: RnfjaRaw, publicacion: Publicacion) {
    const r = adaptRnfja({ ...raw, publicacion });
    return {
      casos: r.casos,
      warnings: r.warnings,
      resumen_warnings: r.resumen_warnings,
      stats: r.stats,
    };
  },
};

registerSource(rnfja);
export default rnfja;
