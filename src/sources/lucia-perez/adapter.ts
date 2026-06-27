// sources/lucia-perez/adapter.ts
// Toma las filas del padrón del Observatorio Lucía Pérez (tabla única) y
// produce un CasoReportadoCompleto por víctima.
// A diferencia del RNFJA (3 tablas), acá hay una sola tabla donde cada fila
// ya representa una víctima con toda la info en línea.

import type {
  CasoReportadoCompleto,
  Publicacion,
  TipologiaUnodc,
  VinculoAutor,
} from '../../schema.js';
import {
  RawRow,
  WarningSink,
  mapValue,
  pick,
  toInt,
  toBool,
  toISODate,
  toStr,
} from '../../core/harmonize.js';
import {
  LUCIA_PEREZ_FUENTE,
  COLS,
  IDENTIDAD_DICT,
  VINCULO_DICT,
  LUGAR_DICT,
  MEDIO_DICT,
  ESTADO_DICT,
  tipologiaDesdeClasificacion,
} from './mapping.js';

export interface LuciaPerezInput {
  rows: RawRow[];
  publicacion: Publicacion;
}

export interface LuciaPerezOutput {
  fuente: typeof LUCIA_PEREZ_FUENTE;
  publicacion: Publicacion;
  casos: CasoReportadoCompleto[];
  warnings: ReturnType<WarningSink['all']>;
  resumen_warnings: ReturnType<WarningSink['resumen']>;
  stats: { filas: number; casos_producidos: number };
}

// La tipología UNODC se deriva del vínculo víctima–autor.
function tipologiaDesdeVinculos(vinculos: VinculoAutor[]): TipologiaUnodc {
  if (vinculos.some((v) => v === 'pareja' || v === 'expareja' || v === 'otra_relacion_afectiva'))
    return 'intimo_pareja';
  if (vinculos.some((v) => v === 'familiar')) return 'familiar';
  if (vinculos.some((v) => v === 'conocido' || v === 'desconocido')) return 'otro';
  return 'no_determinado';
}

export function adaptLuciaPerez(input: LuciaPerezInput): LuciaPerezOutput {
  const warn = new WarningSink(LUCIA_PEREZ_FUENTE.id);
  const casos: CasoReportadoCompleto[] = [];

  for (let idx = 0; idx < input.rows.length; idx++) {
    const row = input.rows[idx];
    const ctx = `fila#${idx}`;

    // --- id externo (si el padrón numera las filas, usar ese número) ---
    const idExterno = toStr(pick(row, COLS.caso.id_externo)) ?? `LP-${idx + 1}`;

    // --- clasificación de fuente (preservar su vocabulario) ---
    const clasificacionFuente =
      toStr(pick(row, COLS.caso.clasificacion_fuente)) ?? 'femicidio (Observatorio Lucía Pérez)';

    // --- sujeto activo (padrón tiene un solo agresor por fila) ---
    const vinculo = mapValue(
      pick(row, COLS.sujeto.vinculo),
      VINCULO_DICT,
      'sujeto_activo.vinculo',
      warn,
      ctx,
    );

    const sujetos = [
      {
        edad: toInt(pick(row, COLS.sujeto.edad)),
        vinculo,
        agente_estatal: toBool(pick(row, COLS.sujeto.agente_estatal)),
        denuncias_previas: toBool(pick(row, COLS.victima.denuncias_previas)),
        medida_proteccion_vigente: toBool(pick(row, COLS.sujeto.medida_proteccion)),
        suicidio_posterior: null,
        notas: null,
      },
    ];

    const tipologia = tipologiaDesdeVinculos([vinculo]);

    // --- estado procesal → respuesta estatal ---
    const estadoCausa = mapValue(
      pick(row, COLS.caso.estado_causa),
      ESTADO_DICT,
      'respuesta_estatal.estado_causa',
      warn,
      ctx,
    );
    const huboCondena =
      estadoCausa === 'sentencia_firme'
        ? true
        : estadoCausa === 'sentencia_no_firme'
          ? true
          : null;

    const completo: CasoReportadoCompleto = {
      caso_reportado: {
        fuente_id: LUCIA_PEREZ_FUENTE.id,
        id_externo: idExterno,
        clasificacion_fuente: clasificacionFuente,
        tipologia_unodc: tipologia,
        criterios_unodc: {
          objetivo: true,
          subjetivo: true,
          legal: true,
          // El Observatorio presume motivación de género por inclusión en el padrón.
          motivacion_genero: 'presunta_registro',
        },
        fecha_hecho: toISODate(pick(row, COLS.caso.fecha_hecho)),
        jurisdiccion: toStr(pick(row, COLS.caso.jurisdiccion)),
        localidad: toStr(pick(row, COLS.caso.localidad)),
      },
      victima: {
        edad: toInt(pick(row, COLS.victima.edad)),
        rango_etario: null,
        identidad: mapValue(
          pick(row, COLS.victima.identidad),
          IDENTIDAD_DICT,
          'victima.identidad',
          warn,
          ctx,
        ),
        nacionalidad: toStr(pick(row, COLS.victima.nacionalidad)),
        embarazo: toBool(pick(row, COLS.victima.embarazo)),
        discapacidad: null,
        desaparicion_previa: null,
        hijos_a_cargo: toInt(pick(row, COLS.victima.hijos_a_cargo)),
        pueblo_originario: null,
        notas: null,
      },
      sujetos_activos: sujetos,
      hecho: {
        lugar: mapValue(pick(row, COLS.caso.lugar), LUGAR_DICT, 'hecho.lugar', warn, ctx),
        medio: mapValue(pick(row, COLS.caso.medio), MEDIO_DICT, 'hecho.medio', warn, ctx),
        violencia_sexual: toBool(pick(row, COLS.caso.violencia_sexual)),
        ensanamiento: null,
        ocultamiento_cuerpo: null,
        contexto_narco_crimen_organizado: null,
        notas: null,
      },
      respuesta_estatal: {
        caratula_judicial: toStr(pick(row, COLS.caso.caratula)),
        agravante_80_inc11: null,
        estado_causa: estadoCausa,
        hubo_condena: huboCondena,
        pena: null,
        fecha_sentencia: null,
        notas: null,
      },
    };

    casos.push(completo);
  }

  return {
    fuente: LUCIA_PEREZ_FUENTE,
    publicacion: input.publicacion,
    casos,
    warnings: warn.all(),
    resumen_warnings: warn.resumen(),
    stats: {
      filas: input.rows.length,
      casos_producidos: casos.length,
    },
  };
}