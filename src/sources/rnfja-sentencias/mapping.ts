// sources/rnfja-sentencias/mapping.ts
//
// Observatorio de Seguimiento de Causas Judiciales y Sentencias de Femicidio
// Directo — Oficina de la Mujer de la CSJN.
//
// Comparte institución, plataforma y formato (.xls/.sav) con el RNFJA: el
// RNFJA registra el HECHO, este Observatorio trackea el DESENLACE JUDICIAL de
// esas mismas causas (estado procesal, condena, pena, fecha de sentencia).
// Por eso se modela como una VARIANTE del RNFJA (fuente_id 'rnfja-sentencias')
// cuyo aporte principal está en el dominio `respuesta_estatal`.
//
// ⚠️ Los .xls del Observatorio traen variables codificadas igual que el RNFJA:
// confirmá nombres de columna y códigos contra el Libro de Códigos del año.
// Lo que no mapee cae en `warnings`, nunca se descarta en silencio.

import type { IdentidadGenero, VinculoAutor, EstadoCausa } from '../../schema.js';
import type { ValueDict } from '../../core/harmonize.js';

export const RNFJA_SENTENCIAS_FUENTE = {
  id: 'rnfja-sentencias',
  nombre:
    'Observatorio de Seguimiento de Causas Judiciales y Sentencias de Femicidio Directo (OM-CSJN)',
  tipo: 'estatal_judicial' as const,
  metodo: 'registro_judicial' as const,
  definicion_base:
    'Seguimiento de la respuesta del sistema de justicia a las causas ' +
    'judiciales de femicidio directo ya registradas por el RNFJA: estado ' +
    'procesal, existencia de condena, pena impuesta y fecha de sentencia. ' +
    'Comparte definición de femicidio directo con el RNFJA (Modelo de ' +
    'Protocolo Latinoamericano + Declaración CEVI); su foco es el desenlace ' +
    'judicial, no el hecho.',
  alcance_categorias: ['femicidio_directo'],
  alineado_unodc: true,
  cita_obligatoria:
    'Fuente: Observatorio de Seguimiento de Causas Judiciales y Sentencias ' +
    'de Femicidio Directo de la Oficina de la Mujer de la Corte Suprema de ' +
    'Justicia de la Nación, complementario del Registro Nacional de ' +
    'Femicidios de la Justicia Argentina (RNFJA).',
};

// Tabla única: 1 fila por causa judicial con su seguimiento de sentencia.
export const FILE_PATTERNS = {
  causas: /sentencia|seguimiento|observatorio|causa|femicidio/i,
};

export const COLS = {
  caso: {
    id_externo: ['id_causa', 'id_caso', 'nro_registro', 'causa', 'id'],
    caratula: ['caratula', 'caratula_judicial', 'caratula_causa'],
    fecha_hecho: ['fecha_hecho', 'fecha_del_hecho', 'fecha'],
    jurisdiccion: ['jurisdiccion', 'provincia', 'jurisdicción'],
    localidad: ['localidad', 'departamento', 'partido'],
    // respuesta estatal (el corazón de esta fuente):
    estado_causa: ['estado_causa', 'estado_procesal', 'estado'],
    resultado: ['resultado', 'condena', 'hubo_condena', 'sentencia'],
    pena: ['pena', 'pena_impuesta', 'monto_pena'],
    fecha_sentencia: ['fecha_sentencia', 'fecha_de_sentencia', 'fecha_fallo'],
  },
  victima: {
    edad: ['edad', 'edad_victima'],
    identidad: ['identidad_genero', 'identidad', 'genero', 'tipo_mujer'],
  },
  sujeto: {
    edad: ['edad_sujeto', 'edad_agresor', 'edad_autor'],
    vinculo: ['vinculo', 'vínculo', 'relacion', 'vinculo_victima'],
  },
};

export const IDENTIDAD_DICT: ValueDict<IdentidadGenero> = {
  exact: {
    '1': 'mujer_cis',
    'mujer cis': 'mujer_cis',
    mujer: 'mujer_cis',
    cis: 'mujer_cis',
    '2': 'mujer_trans_travesti',
    'mujer trans': 'mujer_trans_travesti',
    'mujer trans/travesti': 'mujer_trans_travesti',
    travesti: 'mujer_trans_travesti',
    trans: 'mujer_trans_travesti',
  },
  contains: [
    ['trans', 'mujer_trans_travesti'],
    ['travesti', 'mujer_trans_travesti'],
    ['cis', 'mujer_cis'],
  ],
  fallback: 'no_informada',
};

export const VINCULO_DICT: ValueDict<VinculoAutor> = {
  exact: {
    '1': 'pareja',
    pareja: 'pareja',
    conyuge: 'pareja',
    concubino: 'pareja',
    '2': 'expareja',
    expareja: 'expareja',
    'ex pareja': 'expareja',
    '3': 'familiar',
    familiar: 'familiar',
    padre: 'familiar',
    hijo: 'familiar',
    hermano: 'familiar',
    padrastro: 'familiar',
    '4': 'otra_relacion_afectiva',
    novio: 'otra_relacion_afectiva',
    '5': 'conocido',
    conocido: 'conocido',
    vecino: 'conocido',
    '6': 'desconocido',
    desconocido: 'desconocido',
  },
  contains: [
    ['ex pareja', 'expareja'],
    ['expareja', 'expareja'],
    ['pareja', 'pareja'],
    ['padrastro', 'familiar'],
    ['padre', 'familiar'],
    ['hijo', 'familiar'],
    ['hermano', 'familiar'],
    ['familiar', 'familiar'],
    ['novi', 'otra_relacion_afectiva'],
    ['vecino', 'conocido'],
    ['conocido', 'conocido'],
    ['desconocido', 'desconocido'],
  ],
  fallback: 'no_informado',
};

// Estado procesal de la causa (textual en los informes del Observatorio).
export const ESTADO_DICT: ValueDict<EstadoCausa> = {
  exact: {
    '1': 'etapa_investigacion',
    'etapa de investigacion': 'etapa_investigacion',
    investigacion: 'etapa_investigacion',
    'en tramite': 'etapa_investigacion',
    '2': 'etapa_juicio',
    'etapa de juicio': 'etapa_juicio',
    juicio: 'etapa_juicio',
    'elevada a juicio': 'etapa_juicio',
    'debate oral': 'etapa_juicio',
    '3': 'sentencia_no_firme',
    'sentencia no firme': 'sentencia_no_firme',
    'con sentencia no firme': 'sentencia_no_firme',
    '4': 'sentencia_firme',
    'sentencia firme': 'sentencia_firme',
    'con sentencia firme': 'sentencia_firme',
    '5': 'extincion_accion',
    'extincion de la accion': 'extincion_accion',
    'extincion de la accion por muerte del sujeto activo': 'extincion_accion',
    '6': 'otros_estados',
    'otros estados': 'otros_estados',
    otros: 'otros_estados',
  },
  contains: [
    ['investigacion', 'etapa_investigacion'],
    ['tramite', 'etapa_investigacion'],
    ['juicio', 'etapa_juicio'],
    ['debate', 'etapa_juicio'],
    ['no firme', 'sentencia_no_firme'],
    ['firme', 'sentencia_firme'],
    ['extincion', 'extincion_accion'],
  ],
  fallback: 'no_informado',
};

// Resultado del proceso -> hubo_condena (true/false). Distinto del estado:
// una causa puede estar "con sentencia firme" y haber sido absolutoria.
export type Resultado = 'condena' | 'absolucion' | 'otro';

export const RESULTADO_DICT: ValueDict<Resultado> = {
  exact: {
    '1': 'condena',
    condena: 'condena',
    condenado: 'condena',
    condenatoria: 'condena',
    'condena firme': 'condena',
    culpable: 'condena',
    si: 'condena',
    '2': 'absolucion',
    absolucion: 'absolucion',
    absuelto: 'absolucion',
    absolutoria: 'absolucion',
    sobreseimiento: 'absolucion',
    sobreseido: 'absolucion',
    no: 'absolucion',
    '3': 'otro',
    'sin sentencia': 'otro',
    'sin resolver': 'otro',
  },
  contains: [
    ['conden', 'condena'],
    ['culpable', 'condena'],
    ['absol', 'absolucion'],
    ['sobresei', 'absolucion'],
  ],
  fallback: 'otro',
};
