// sources/aqsnv/mapping.ts
// Diccionarios de valor para Ahora Que Sí Nos Ven (AQSNV).
// Fuente: monitoreo de medios gráficos, audiovisuales y digitales de alcance
// federal con sistema informático de rastreo y equipo interdisciplinario
// (programación, comunicación con perspectiva de género, abogadas).
// Publica informes periódicos con datos per-case en su sitio web
// (ahoraquesinosven.com.ar).

import type {
  IdentidadGenero,
  VinculoAutor,
  LugarHecho,
  MedioComisivo,
  EstadoCausa,
} from '../../schema.js';
import type { ValueDict } from '../../core/harmonize.js';

export const AQSNV_FUENTE = {
  id: 'aqsnv',
  nombre: 'Ahora Que Sí Nos Ven — Observatorio de las violencias de género',
  tipo: 'sociedad_civil' as const,
  metodo: 'monitoreo_medios' as const,
  definicion_base:
    'Femicidios, travesticidios/transfemicidios e instigación al suicidio ' +
    'relevados por monitoreo diario de medios gráficos, audiovisuales y ' +
    'digitales de alcance federal, con sistema informático de rastreo y ' +
    'equipo interdisciplinario (programación, comunicación con perspectiva ' +
    'de género y abogadas).',
  alcance_categorias: [
    'femicidio',
    'travesticidio_transfemicidio',
    'instigacion_al_suicidio',
  ],
  alineado_unodc: false,
  cita_obligatoria:
    'Fuente: Observatorio de Femicidios "Ahora Que Sí Nos Ven" ' +
    '(https://ahoraquesinosven.com.ar), a partir de monitoreo diario ' +
    'de medios de alcance federal.',
};

export const FILE_PATTERNS = {
  casos: /aqsnv|ahora|registro|casos|informe/i,
};

export const COLS = {
  caso: {
    id_externo: ['id', 'numero', 'nro', 'caso_id'],
    clasificacion_fuente: [
      'tipo', 'clasificacion', 'categoria', 'tipo_femicidio',
      'tipo_caso',
    ],
    fecha_hecho: ['fecha', 'fecha_hecho', 'fecha_del_hecho', 'dia'],
    jurisdiccion: ['provincia', 'jurisdiccion', 'jurisdicción'],
    localidad: ['localidad', 'ciudad', 'departamento'],
    lugar: ['lugar', 'lugar_hecho', 'lugar_del_hecho'],
    medio: ['medio', 'modalidad', 'arma', 'mecanismo'],
    violencia_sexual: ['violencia_sexual', 'abuso_sexual'],
    // respuesta estatal (AQSNV tiene mirada legal: abogadas en el equipo)
    fiscal: ['fiscal', 'fiscal_a_cargo', 'fiscalia'],
    caratula: ['caratula', 'caratula_judicial', 'causa'],
    estado_causa: ['estado_causa', 'estado_procesal', 'estado'],
  },
  victima: {
    edad: ['edad', 'edad_victima'],
    identidad: ['identidad', 'identidad_genero', 'genero', 'tipo_mujer'],
    nacionalidad: ['nacionalidad'],
    embarazo: ['embarazo', 'embarazada'],
    hijos_a_cargo: ['hijos', 'hijos_a_cargo', 'cantidad_hijos', 'huerfanos'],
    denuncias_previas: ['denuncias_previas', 'denuncia_previa', 'denuncias'],
  },
  sujeto: {
    vinculo: [
      'vinculo', 'vínculo', 'relacion', 'vinculo_victima',
      'vinculo_agresor', 'vinculo_autor',
    ],
    edad: ['edad_sujeto', 'edad_agresor', 'edad_autor'],
    agente_estatal: ['agente_estatal', 'fuerza_seguridad', 'policia'],
    medida_proteccion: [
      'medida_proteccion', 'medida_proteccion_vigente', 'restriccion',
      'perimetral',
    ],
  },
};

export const IDENTIDAD_DICT: ValueDict<IdentidadGenero> = {
  exact: {
    'mujer': 'mujer_cis',
    'mujer cis': 'mujer_cis',
    'cis': 'mujer_cis',
    'mujer trans': 'mujer_trans_travesti',
    'mujer trans/travesti': 'mujer_trans_travesti',
    'mujer transexual': 'mujer_trans_travesti',
    'mujer transgenero': 'mujer_trans_travesti',
    'travesti': 'mujer_trans_travesti',
    'trans': 'mujer_trans_travesti',
    'transfemenina': 'mujer_trans_travesti',
    'otra': 'otra',
    'no informada': 'no_informada',
  },
  contains: [
    ['trans', 'mujer_trans_travesti'],
    ['travesti', 'mujer_trans_travesti'],
    ['mujer', 'mujer_cis'],
  ],
  fallback: 'no_informada',
};

export const VINCULO_DICT: ValueDict<VinculoAutor> = {
  exact: {
    'pareja': 'pareja',
    'novio': 'pareja',
    'novia': 'pareja',
    'esposo': 'pareja',
    'esposa': 'pareja',
    'conviviente': 'pareja',
    'expareja': 'expareja',
    'ex pareja': 'expareja',
    'ex novio': 'expareja',
    'ex esposo': 'expareja',
    'padre': 'familiar',
    'madre': 'familiar',
    'padrastro': 'familiar',
    'hijo': 'familiar',
    'hija': 'familiar',
    'hermano': 'familiar',
    'hermana': 'familiar',
    'tio': 'familiar',
    'primo': 'familiar',
    'familiar': 'familiar',
    'conocido': 'conocido',
    'vecino': 'conocido',
    'amigo': 'conocido',
    'desconocido': 'desconocido',
    'no informado': 'no_informado',
  },
  contains: [
    ['pareja', 'pareja'],
    ['ex', 'expareja'],
    ['familiar', 'familiar'],
    ['conocido', 'conocido'],
    ['desconocido', 'desconocido'],
  ],
  fallback: 'no_informado',
};

export const LUGAR_DICT: ValueDict<LugarHecho> = {
  exact: {
    'vivienda de la victima': 'vivienda_victima',
    'vivienda victima': 'vivienda_victima',
    'casa de la victima': 'vivienda_victima',
    'vivienda compartida': 'vivienda_compartida',
    'vivienda del autor': 'vivienda_autor',
    'vivienda del agresor': 'vivienda_autor',
    'espacio publico': 'espacio_publico',
    'via publica': 'espacio_publico',
    'calle': 'espacio_publico',
    'lugar de trabajo': 'lugar_trabajo',
    'otro': 'otro',
    'no informado': 'no_informado',
  },
  fallback: 'no_informado',
};

export const MEDIO_DICT: ValueDict<MedioComisivo> = {
  exact: {
    'arma de fuego': 'arma_fuego',
    'arma fuego': 'arma_fuego',
    'disparo': 'arma_fuego',
    'arma blanca': 'arma_blanca',
    'cuchillo': 'arma_blanca',
    'punalada': 'arma_blanca',
    'fuerza fisica': 'fuerza_fisica',
    'golpes': 'fuerza_fisica',
    'asfixia': 'asfixia',
    'ahorcamiento': 'asfixia',
    'estrangulamiento': 'asfixia',
    'fuego': 'fuego',
    'quemada': 'fuego',
    'otro': 'otro',
    'no informado': 'no_informado',
  },
  fallback: 'no_informado',
};

export const ESTADO_DICT: ValueDict<EstadoCausa> = {
  exact: {
    'etapa de investigacion': 'etapa_investigacion',
    'investigacion': 'etapa_investigacion',
    'en investigacion': 'etapa_investigacion',
    'etapa de juicio': 'etapa_juicio',
    'juicio': 'etapa_juicio',
    'elevada a juicio': 'etapa_juicio',
    'sentencia no firme': 'sentencia_no_firme',
    'sentencia': 'sentencia_no_firme',
    'condenado': 'sentencia_no_firme',
    'sentencia firme': 'sentencia_firme',
    'condena firme': 'sentencia_firme',
    'extincion de la accion': 'extincion_accion',
    'muerte del imputado': 'extincion_accion',
    'otros': 'otros_estados',
    'no informado': 'no_informado',
  },
  fallback: 'no_informado',
};