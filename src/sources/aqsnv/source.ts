// sources/aqsnv/source.ts
// STUB — Ahora Que Sí Nos Ven (monitoreo de medios, una sola tabla).
// Muestra el patrón de "agregar una fuente": implementás meta + extract +
// normalize y registrás. NADA del core cambia. El mapping y la normalización
// reales quedan pendientes (próximo ladrillo).

import { registerSource, type SourceModule, type SourceInput } from '../../core/registry.js';
import type { Publicacion } from '../../schema.js';

const PENDIENTE = true;

const aqsnv: SourceModule<unknown> = {
  meta: {
    id: 'aqsnv',
    nombre: 'Ahora Que Sí Nos Ven — Observatorio de las violencias de género',
    tipo: 'sociedad_civil',
    metodo: 'monitoreo_medios',
    definicion_base:
      'Femicidios, travesticidios/transfemicidios e instigación al suicidio ' +
      'relevados por monitoreo diario de medios.',
    alcance_categorias: ['femicidio', 'travesticidio_transfemicidio', 'instigacion_al_suicidio'],
    alineado_unodc: false,
  },

  publicacionPorDefecto(input: SourceInput): Publicacion {
    return {
      fuente_id: 'aqsnv',
      periodo_inicio: `${input.anio}-01-01`,
      periodo_fin: `${input.anio}-12-31`,
      fecha_publicacion: `${input.anio}-12-31`,
      version: `aqsnv-${input.anio}`,
      formato: 'csv',
    };
  },

  extract(): unknown {
    if (PENDIENTE) throw new Error('AQSNV: adaptador pendiente (stub). Próximo ladrillo.');
    return null;
  },

  normalize() {
    return { casos: [], warnings: [], resumen_warnings: [], stats: {} };
  },
};

registerSource(aqsnv);
export default aqsnv;
