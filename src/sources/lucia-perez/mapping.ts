// sources/lucia-perez/mapping.ts
// Diccionarios de valor para el Observatorio Lucía Pérez.
// Fuente: monitoreo diario de medios nacionales y locales + datos de
// familiares. Publica un padrón público per-case con: lugar del hecho,
// fiscal, carátula judicial, denuncias previas, hijos/as, vínculo con el
// agresor. Informes mensuales + anuales 2022-2026.
//
// ⚠️ Valores precargados con lo documentado en su sitio (observatorioluciaperez.org)
// y artículos periodísticos (Unidiversidad 2021). Verificar contra datos reales.

import type {
  IdentidadGenero,
  VinculoAutor,
  LugarHecho,
  MedioComisivo,
  EstadoCausa,
} from '../../schema.js';
import type { ValueDict } from '../../core/harmonize.js';

export const LUCIA_PEREZ_FUENTE = {
  id: 'lucia-perez',
  nombre: 'Observatorio Lucía Pérez — Monitoreo de femicidios y travesticidios',
  tipo: 'sociedad_civil' as const,
  metodo: 'monitoreo_medios' as const,
  definicion_base:
    'Femicidios, travesticidios/transfemicidios, femicidios vinculados, ' +
    'suicidios feminicidas e instigación al suicidio relevados por monitoreo ' +
    'diario de medios nacionales y locales, complementado con datos de ' +
    'familiares de las víctimas.',
  alcance_categorias: [
    'femicidio_directo',
    'femicidio_vinculado',
    'travesticidio_transfemicidio',
    'suicidio_feminicida',
    'instigacion_al_suicidio',
  ],
  alineado_unodc: false,
  cita_obligatoria:
    'Fuente: Observatorio Lucía Pérez (https://observatorioluciaperez.org), ' +
    'a partir de monitoreo diario de medios nacionales y locales.',
};

// Patrón de archivo: el padrón exportado como CSV.
export const FILE_PATTERNS = {
  casos: /padron|registro|casos|lucia/i,
};

// Alias de columnas (el padrón tiene estructura de tabla única).
export const COLS = {
  caso: {
    id_externo: ['id', 'numero', 'nro', 'caso_id'],
    clasificacion_fuente: ['tipo', 'clasificacion', 'categoria', 'tipo_femicidio'],
    fecha_hecho: ['fecha', 'fecha_hecho', 'fecha_del_hecho'],
    jurisdiccion: ['provincia', 'jurisdiccion', 'jurisdicción'],
    localidad: ['localidad', 'ciudad', 'departamento'],
    lugar: ['lugar', 'lugar_hecho', 'lugar_del_hecho'],
    medio: ['medio', 'modalidad', 'arma', 'mecanismo'],
    violencia_sexual: ['violencia_sexual', 'abuso_sexual'],
    // respuesta estatal
    fiscal: ['fiscal', 'fiscal_a_cargo', 'fiscalia'],
    caratula: ['caratula', 'caratula_judicial', 'causa'],
    estado_causa: ['estado_causa', 'estado_procesal', 'estado'],
  },
  victima: {
    edad: ['edad', 'edad_victima'],
    identidad: ['identidad', 'identidad_genero', 'genero'],
    nacionalidad: ['nacionalidad'],
    embarazo: ['embarazo', 'embarazada'],
    hijos_a_cargo: ['hijos', 'hijos_a_cargo', 'cantidad_hijos', 'huerfanos'],
    denuncias_previas: ['denuncias_previas', 'denuncia_previa', 'denuncias'],
  },
  sujeto: {
    vinculo: ['vinculo', 'vínculo', 'relacion', 'vinculo_victima', 'vinculo_agresor'],
    edad: ['edad_sujeto', 'edad_agresor', 'edad_autor'],
    agente_estatal: ['agente_estatal', 'fuerza_seguridad', 'policia'],
    medida_proteccion: ['medida_proteccion', 'medida_proteccion_vigente', 'restriccion'],
  },
};

// ---- Diccionarios de valor ----

export const IDENTIDAD_DICT: ValueDict<IdentidadGenero> = {
  exact: {
    'mujer cis': 'mujer_cis',
    'mujer': 'mujer_cis',
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
    'sin datos': 'no_informada',
    's/d': 'no_informada',
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
    'concubino': 'pareja',
    'expareja': 'expareja',
    'ex pareja': 'expareja',
    'ex novio': 'expareja',
    'ex esposo': 'expareja',
    'ex conviviente': 'expareja',
    'amante': 'otra_relacion_afectiva',
    'relacion afectiva': 'otra_relacion_afectiva',
    'padre': 'familiar',
    'madre': 'familiar',
    'padrastro': 'familiar',
    'madrastra': 'familiar',
    'hijo': 'familiar',
    'hija': 'familiar',
    'hermano': 'familiar',
    'hermana': 'familiar',
    'tio': 'familiar',
    'tia': 'familiar',
    'primo': 'familiar',
    'prima': 'familiar',
    'abuelo': 'familiar',
    'abuela': 'familiar',
    'suegro': 'familiar',
    'suegra': 'familiar',
    'yerno': 'familiar',
    'nuera': 'familiar',
    'cunado': 'familiar',
    'cunada': 'familiar',
    'familiar': 'familiar',
    'conocido': 'conocido',
    'vecino': 'conocido',
    'vecina': 'conocido',
    'amigo': 'conocido',
    'amiga': 'conocido',
    'compañero de trabajo': 'conocido',
    'desconocido': 'desconocido',
    'no informado': 'no_informado',
    'sin datos': 'no_informado',
  },
  contains: [
    ['pareja', 'pareja'],
    ['ex pareja', 'expareja'],
    ['expareja', 'expareja'],
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
    'domicilio de la victima': 'vivienda_victima',
    'casa de la victima': 'vivienda_victima',
    'vivienda compartida': 'vivienda_compartida',
    'domicilio compartido': 'vivienda_compartida',
    'vivienda del autor': 'vivienda_autor',
    'vivienda del agresor': 'vivienda_autor',
    'domicilio del agresor': 'vivienda_autor',
    'casa del agresor': 'vivienda_autor',
    'espacio publico': 'espacio_publico',
    'via publica': 'espacio_publico',
    'calle': 'espacio_publico',
    'plaza': 'espacio_publico',
    'lugar de trabajo': 'lugar_trabajo',
    'trabajo': 'lugar_trabajo',
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
    'bala': 'arma_fuego',
    'arma blanca': 'arma_blanca',
    'cuchillo': 'arma_blanca',
    'punalada': 'arma_blanca',
    'apuñalada': 'arma_blanca',
    'fuerza fisica': 'fuerza_fisica',
    'golpes': 'fuerza_fisica',
    'golpiza': 'fuerza_fisica',
    'asfixia': 'asfixia',
    'ahorcamiento': 'asfixia',
    'estrangulamiento': 'asfixia',
    'sofocacion': 'asfixia',
    'fuego': 'fuego',
    'quemada': 'fuego',
    'incendio': 'fuego',
    'veneno': 'veneno',
    'envenenamiento': 'veneno',
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
    'investigacion preliminar': 'etapa_investigacion',
    'etapa de juicio': 'etapa_juicio',
    'juicio': 'etapa_juicio',
    'juicio oral': 'etapa_juicio',
    'elevada a juicio': 'etapa_juicio',
    'sentencia no firme': 'sentencia_no_firme',
    'sentencia': 'sentencia_no_firme',
    'condenado': 'sentencia_no_firme',
    'sentencia firme': 'sentencia_firme',
    'condena firme': 'sentencia_firme',
    'extincion de la accion': 'extincion_accion',
    'extincion': 'extincion_accion',
    'muerte del imputado': 'extincion_accion',
    'otros': 'otros_estados',
    'no informado': 'no_informado',
  },
  fallback: 'no_informado',
};

// Tipología UNODC derivada de la clasificación de fuente.
// Lucía Pérez clasifica los casos de forma más granular que UNODC:
// "femicidio directo", "travesticidio", "vinculado", "suicidio feminicida",
// "instigación al suicidio". Mapeamos a las categorías base.
export function tipologiaDesdeClasificacion(raw: string): 'intimo_pareja' | 'familiar' | 'otro' | 'no_determinado' {
  // La tipología UNODC requiere datos de vínculo, no solo la clasificación.
  // Dado que Lucía Pérez SÍ publica vínculo, la derivación real se hace en
  // adapter.ts usando los sujetos activos. Esta función es un fallback para
  // cuando no hay datos de vínculo.
  return 'no_determinado';
}