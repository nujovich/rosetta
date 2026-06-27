// sources/rnfja/mapping.ts
//
// ⚠️⚠️⚠️  VERIFICAR CONTRA EL LIBRO DE CÓDIGOS DEL AÑO  ⚠️⚠️⚠️
// El RNFJA publica los .xls con VARIABLES CODIFICADAS (números) cuyas
// etiquetas viven en el "Libro de Códigos" de cada año. Este archivo declara:
//   - los alias de columna esperados (nombres pueden variar por año), y
//   - los diccionarios de valor (código/etiqueta -> término canónico).
// Están precargados con lo que figura en los informes públicos del RNFJA,
// pero los CÓDIGOS NUMÉRICOS reales hay que confirmarlos con el Libro de
// Códigos. Mientras tanto, el motor también matchea por etiqueta (si exportás
// el .xls "con labels"), y cualquier valor no mapeado cae en warnings.
//
// Esta es la ÚNICA pieza que se reescribe por fuente. El resto es genérico.

import type {
  IdentidadGenero,
  VinculoAutor,
  LugarHecho,
  MedioComisivo,
  EstadoCausa,
} from '../../schema.js';
import type { ValueDict } from '../../core/harmonize.js';

export const RNFJA_FUENTE = {
  id: 'rnfja',
  nombre: 'Registro Nacional de Femicidios de la Justicia Argentina (OM-CSJN)',
  tipo: 'estatal_judicial' as const,
  metodo: 'registro_judicial' as const,
  definicion_base:
    'Muertes violentas de mujeres cis y mujeres trans/travestis por razones ' +
    'de género investigadas en causas judiciales, con independencia de la ' +
    'calificación legal (Modelo de Protocolo Latinoamericano + Declaración CEVI).',
  alcance_categorias: ['femicidio_directo', 'femicidio_vinculado', 'transfemicidio_travesticidio'],
  alineado_unodc: true,
  cita_obligatoria:
    'Fuente: Registro Nacional de Femicidios de la Justicia Argentina (RNFJA) ' +
    'de la Oficina de la Mujer de la Corte Suprema de Justicia de la Nación, a ' +
    'partir de datos aportados por cada una de las jurisdicciones de la Justicia Argentina.',
};

// Patrones para reconocer cada una de las 3 bases dentro de un directorio.
export const FILE_PATTERNS = {
  causa: /causa|hecho/i,
  victima: /victima|víctima/i,
  sujeto: /sujeto|activo|agresor/i,
};

// Clave de unión entre las 3 bases (id anonimizado de causa). ⚠️ confirmar nombre.
export const JOIN_KEY = {
  causa: ['id_causa', 'causa', 'id_caso', 'nro_registro', 'id'],
  victima: ['id_causa', 'causa', 'id_caso'],
  sujeto: ['id_causa', 'causa', 'id_caso'],
};

// ---- Alias de columnas (⚠️ confirmar con Libro de Códigos) ----

export const COLS = {
  causa: {
    jurisdiccion: ['jurisdiccion', 'provincia', 'jurisdicción'],
    fecha_hecho: ['fecha_hecho', 'fecha_del_hecho', 'fecha'],
    localidad: ['localidad', 'departamento', 'partido'],
    lugar: ['lugar_hecho', 'lugar_del_hecho', 'lugar'],
    medio: ['medio', 'modalidad', 'arma', 'mecanismo'],
    tipo_femicidio: ['tipo_femicidio', 'tipo', 'categoria'],
    violencia_sexual: ['violencia_sexual', 'abuso_sexual'],
    estado_causa: ['estado_causa', 'estado_procesal', 'estado'],
  },
  victima: {
    edad: ['edad', 'edad_victima'],
    identidad: ['identidad_genero', 'identidad', 'genero', 'tipo_mujer'],
    nacionalidad: ['nacionalidad'],
    embarazo: ['embarazo', 'embarazada'],
    discapacidad: ['discapacidad'],
    hijos_a_cargo: ['hijos_a_cargo', 'hijos', 'cantidad_hijos'],
    pueblo_originario: ['pueblo_originario', 'indigena'],
  },
  sujeto: {
    edad: ['edad', 'edad_sujeto', 'edad_agresor'],
    vinculo: ['vinculo', 'vínculo', 'relacion', 'vinculo_victima'],
    agente_estatal: ['agente_estatal', 'fuerza_seguridad'],
    suicidio_posterior: ['suicidio', 'suicidio_posterior', 'se_suicido'],
    estado_procesal: ['estado_procesal', 'situacion_procesal', 'estado'],
  },
};

// ---- Diccionarios de valor ----
// `exact` admite tanto código numérico ('1') como etiqueta normalizada.
// ⚠️ los códigos numéricos de abajo son TENTATIVOS: reemplazar por los del Libro.

export const IDENTIDAD_DICT: ValueDict<IdentidadGenero> = {
  exact: {
    '1': 'mujer_cis',
    'mujer cis': 'mujer_cis',
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
    'ex-pareja': 'expareja',
    '3': 'familiar',
    familiar: 'familiar',
    padre: 'familiar',
    hijo: 'familiar',
    hermano: 'familiar',
    padrastro: 'familiar',
    yerno: 'familiar',
    '4': 'otra_relacion_afectiva',
    novio: 'otra_relacion_afectiva',
    novia: 'otra_relacion_afectiva',
    '5': 'conocido',
    conocido: 'conocido',
    vecino: 'conocido',
    '6': 'desconocido',
    desconocido: 'desconocido',
    'sin vinculo': 'desconocido',
  },
  contains: [
    ['ex pareja', 'expareja'],
    ['expareja', 'expareja'],
    ['ex-pareja', 'expareja'],
    ['pareja', 'pareja'],
    ['padre', 'familiar'],
    ['padrastro', 'familiar'],
    ['hijo', 'familiar'],
    ['hermano', 'familiar'],
    ['yerno', 'familiar'],
    ['familiar', 'familiar'],
    ['novi', 'otra_relacion_afectiva'],
    ['vecino', 'conocido'],
    ['conocido', 'conocido'],
    ['desconocido', 'desconocido'],
  ],
  fallback: 'no_informado',
};

export const LUGAR_DICT: ValueDict<LugarHecho> = {
  exact: {
    '1': 'vivienda_victima',
    'vivienda de la victima': 'vivienda_victima',
    'vivienda victima': 'vivienda_victima',
    '2': 'vivienda_compartida',
    'vivienda compartida': 'vivienda_compartida',
    '3': 'vivienda_autor',
    'vivienda del sujeto activo': 'vivienda_autor',
    'vivienda sujeto activo': 'vivienda_autor',
    '4': 'lugar_trabajo',
    'lugar de trabajo': 'lugar_trabajo',
    '5': 'espacio_publico',
    'espacio abierto': 'espacio_publico',
    'espacio publico': 'espacio_publico',
    'via publica': 'espacio_publico',
  },
  contains: [
    ['vivienda compartida', 'vivienda_compartida'],
    ['compartid', 'vivienda_compartida'],
    ['vivienda de la victima', 'vivienda_victima'],
    ['vivienda victima', 'vivienda_victima'],
    ['sujeto activo', 'vivienda_autor'],
    ['trabajo', 'lugar_trabajo'],
    ['espacio abierto', 'espacio_publico'],
    ['publica', 'espacio_publico'],
    ['publico', 'espacio_publico'],
  ],
  fallback: 'no_informado',
};

export const MEDIO_DICT: ValueDict<MedioComisivo> = {
  exact: {
    '1': 'arma_fuego',
    'arma de fuego': 'arma_fuego',
    '2': 'arma_blanca',
    'arma blanca': 'arma_blanca',
    cuchillo: 'arma_blanca',
    '3': 'fuerza_fisica',
    'fuerza fisica': 'fuerza_fisica',
    golpes: 'fuerza_fisica',
    '4': 'asfixia',
    asfixia: 'asfixia',
    estrangulamiento: 'asfixia',
    '5': 'fuego',
    fuego: 'fuego',
    quemada: 'fuego',
    '6': 'veneno',
    veneno: 'veneno',
    envenenamiento: 'veneno',
  },
  contains: [
    ['fuego', 'arma_fuego'], // ojo: "arma de fuego" antes que "fuego" -> exact lo cubre
    ['blanca', 'arma_blanca'],
    ['cuchill', 'arma_blanca'],
    ['estrangul', 'asfixia'],
    ['asfixia', 'asfixia'],
    ['ahorca', 'asfixia'],
    ['golpe', 'fuerza_fisica'],
    ['fisica', 'fuerza_fisica'],
    ['quema', 'fuego'],
    ['incendi', 'fuego'],
    ['veneno', 'veneno'],
  ],
  fallback: 'no_informado',
};

// Categorías unificadoras de estado procesal (textuales en los informes RNFJA).
export const ESTADO_DICT: ValueDict<EstadoCausa> = {
  exact: {
    '1': 'etapa_investigacion',
    'etapa de investigacion': 'etapa_investigacion',
    investigacion: 'etapa_investigacion',
    '2': 'etapa_juicio',
    'etapa de juicio': 'etapa_juicio',
    juicio: 'etapa_juicio',
    '3': 'sentencia_no_firme',
    'sentencia no firme': 'sentencia_no_firme',
    '4': 'sentencia_firme',
    'sentencia firme': 'sentencia_firme',
    '5': 'extincion_accion',
    'extincion de la accion por muerte del sujeto activo': 'extincion_accion',
    'extincion de la accion': 'extincion_accion',
    '6': 'otros_estados',
    'otros estados': 'otros_estados',
    otros: 'otros_estados',
  },
  contains: [
    ['investigacion', 'etapa_investigacion'],
    ['juicio', 'etapa_juicio'],
    ['no firme', 'sentencia_no_firme'],
    ['firme', 'sentencia_firme'],
    ['extincion', 'extincion_accion'],
  ],
  fallback: 'no_informado',
};
