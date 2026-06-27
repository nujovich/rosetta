// sources/snic/source.ts
// Envuelve el adaptador del SNIC en la interfaz ReferenceModule y lo registra
// en el registry de referencia (NO en el de caso_reportado). Lectura de la
// serie como CSV/XLSX vía io.ts: descargá la serie de datos.gob.ar
// (?format=csv) y dejala en el directorio.

import {
  registerReferenceSource,
  type ReferenceModule,
  type ReferenceInput,
} from '../../core/reference.js';
import { readSheet, findFile } from '../../core/io.js';
import type { Publicacion } from '../../schema.js';
import type { RawRow } from '../../core/harmonize.js';
import { adaptSnic } from './adapter.js';
import { SNIC_FUENTE, FILE_PATTERNS } from './mapping.js';

interface SnicRaw {
  rows: RawRow[];
}

// La serie del SNIC es multi-anual; el año es opcional (default: rango amplio).
const snic: ReferenceModule<SnicRaw> = {
  meta: SNIC_FUENTE,

  publicacionPorDefecto(input: ReferenceInput): Publicacion {
    const anio = input.anio ?? '2025';
    return {
      fuente_id: SNIC_FUENTE.id,
      periodo_inicio: '2016-01-01',
      periodo_fin: `${anio}-12-31`,
      fecha_publicacion: `${anio}-12-31`,
      version: `snic-serie-${anio}`,
      formato: 'csv',
      url_datos: 'https://datos.gob.ar/series/api/series/?ids=t_snic_1_hechos_02&format=csv',
    };
  },

  extract(input: ReferenceInput): SnicRaw {
    const f = findFile(input.dir, FILE_PATTERNS.serie);
    if (!f) {
      throw new Error(
        `SNIC: no se encontró la serie en ${input.dir}. ` +
          `Buscado con patrón: ${FILE_PATTERNS.serie}`,
      );
    }
    const rows = readSheet(f);
    if (rows.length === 0) {
      throw new Error(`SNIC: archivo vacío: ${f}`);
    }
    return { rows };
  },

  normalize(raw: SnicRaw, publicacion: Publicacion) {
    return adaptSnic({ rows: raw.rows, publicacion });
  },
};

registerReferenceSource(snic);
export default snic;
