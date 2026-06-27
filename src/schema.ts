// schema.ts
// Tipos canónicos del Estándar Abierto de Datos de Femicidios (v0.1).
// Espejo en TypeScript del esquema PostgreSQL. Un adaptador produce
// objetos CasoReportadoCompleto listos para insertar en la base.

// ---- Vocabularios controlados (espejo de los ENUM de Postgres) ----

export type TipoFuente =
  | 'estatal_judicial'
  | 'estatal_ejecutivo'
  | 'sociedad_civil'
  | 'academico'
  | 'internacional';

export type MetodoRecoleccion =
  | 'registro_judicial'
  | 'registro_administrativo'
  | 'monitoreo_medios'
  | 'mixto';

export type TipologiaUnodc = 'intimo_pareja' | 'familiar' | 'otro' | 'no_determinado';

export type IdentidadGenero = 'mujer_cis' | 'mujer_trans_travesti' | 'otra' | 'no_informada';

export type VinculoAutor =
  | 'pareja'
  | 'expareja'
  | 'otra_relacion_afectiva'
  | 'familiar'
  | 'conocido'
  | 'desconocido'
  | 'no_informado';

export type LugarHecho =
  | 'vivienda_victima'
  | 'vivienda_compartida'
  | 'vivienda_autor'
  | 'espacio_publico'
  | 'lugar_trabajo'
  | 'otro'
  | 'no_informado';

export type MedioComisivo =
  | 'arma_fuego'
  | 'arma_blanca'
  | 'fuerza_fisica'
  | 'asfixia'
  | 'fuego'
  | 'veneno'
  | 'otro'
  | 'no_informado';

export type EstadoCausa =
  | 'etapa_investigacion'
  | 'etapa_juicio'
  | 'sentencia_no_firme'
  | 'sentencia_firme'
  | 'extincion_accion'
  | 'otros_estados'
  | 'no_informado';

// ---- Procedencia ----

export interface Publicacion {
  fuente_id: string;
  periodo_inicio: string; // 'YYYY-MM-DD'
  periodo_fin: string;
  fecha_publicacion: string;
  version: string;
  url_datos?: string;
  formato?: string;
  hash_sha256?: string;
}

// ---- Dominios ----

export interface Victima {
  edad: number | null;
  rango_etario: string | null;
  identidad: IdentidadGenero;
  nacionalidad: string | null;
  embarazo: boolean | null;
  discapacidad: boolean | null;
  desaparicion_previa: boolean | null;
  hijos_a_cargo: number | null;
  pueblo_originario: boolean | null;
  notas: string | null;
}

export interface SujetoActivo {
  edad: number | null;
  vinculo: VinculoAutor;
  agente_estatal: boolean | null;
  denuncias_previas: boolean | null;
  medida_proteccion_vigente: boolean | null;
  suicidio_posterior: boolean | null;
  notas: string | null;
}

export interface Hecho {
  lugar: LugarHecho;
  medio: MedioComisivo;
  violencia_sexual: boolean | null;
  ensanamiento: boolean | null;
  ocultamiento_cuerpo: boolean | null;
  contexto_narco_crimen_organizado: boolean | null;
  notas: string | null;
}

export interface RespuestaEstatal {
  caratula_judicial: string | null;
  agravante_80_inc11: boolean | null;
  estado_causa: EstadoCausa;
  hubo_condena: boolean | null;
  pena: string | null;
  fecha_sentencia: string | null;
  notas: string | null;
}

export interface CriteriosUnodc {
  objetivo: boolean;
  subjetivo: boolean;
  legal: boolean;
  // 'presunta_registro' = se presume por la inclusión en el registro de la fuente
  motivacion_genero: 'si' | 'presunta_registro' | 'no' | 'no_determinada';
}

export interface CasoReportado {
  fuente_id: string;
  id_externo: string;
  clasificacion_fuente: string; // vocabulario de la fuente, preservado tal cual
  tipologia_unodc: TipologiaUnodc;
  criterios_unodc: CriteriosUnodc;
  fecha_hecho: string | null;
  jurisdiccion: string | null;
  localidad: string | null;
}

// Objeto agregado que produce el adaptador (1 por víctima).
export interface CasoReportadoCompleto {
  caso_reportado: CasoReportado;
  victima: Victima;
  sujetos_activos: SujetoActivo[];
  hecho: Hecho;
  respuesta_estatal: RespuestaEstatal;
}
