// sources/rnfja-sentencias/adapter.ts
// Toma la base de seguimiento de causas/sentencias del Observatorio de la
// OM-CSJN (tabla única, 1 fila por causa) y produce un CasoReportadoCompleto
// por causa. A diferencia del RNFJA "de hecho", el valor de esta fuente está
// concentrado en `respuesta_estatal`: estado de la causa, si hubo condena,
// pena y fecha de sentencia. El resto de los dominios se completa con lo que
// la base traiga (suele compartir víctima/vínculo con el RNFJA).

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
  toISODate,
  toStr,
} from '../../core/harmonize.js';
import {
  RNFJA_SENTENCIAS_FUENTE,
  COLS,
  IDENTIDAD_DICT,
  VINCULO_DICT,
  ESTADO_DICT,
  RESULTADO_DICT,
} from './mapping.js';

export interface RnfjaSentenciasInput {
  rows: RawRow[];
  publicacion: Publicacion;
}

export interface RnfjaSentenciasOutput {
  fuente: typeof RNFJA_SENTENCIAS_FUENTE;
  publicacion: Publicacion;
  casos: CasoReportadoCompleto[];
  warnings: ReturnType<WarningSink['all']>;
  resumen_warnings: ReturnType<WarningSink['resumen']>;
  stats: {
    filas: number;
    casos_producidos: number;
    con_condena: number;
    con_sentencia: number;
  };
}

function tipologiaDesdeVinculo(v: VinculoAutor): TipologiaUnodc {
  if (v === 'pareja' || v === 'expareja' || v === 'otra_relacion_afectiva') return 'intimo_pareja';
  if (v === 'familiar') return 'familiar';
  if (v === 'conocido' || v === 'desconocido') return 'otro';
  return 'no_determinado';
}

export function adaptRnfjaSentencias(input: RnfjaSentenciasInput): RnfjaSentenciasOutput {
  const warn = new WarningSink(RNFJA_SENTENCIAS_FUENTE.id);
  const casos: CasoReportadoCompleto[] = [];
  let conCondena = 0;
  let conSentencia = 0;

  input.rows.forEach((row, idx) => {
    const ctx = `fila#${idx}`;
    const idExterno = toStr(pick(row, COLS.caso.id_externo)) ?? `RNFJA-SENT-${idx + 1}`;

    const vinculo = mapValue(
      pick(row, COLS.sujeto.vinculo),
      VINCULO_DICT,
      'sujeto_activo.vinculo',
      warn,
      ctx,
    );
    const tipologia = tipologiaDesdeVinculo(vinculo);

    const estadoCausa = mapValue(
      pick(row, COLS.caso.estado_causa),
      ESTADO_DICT,
      'respuesta_estatal.estado_causa',
      warn,
      ctx,
    );

    // hubo_condena: prioriza la columna de resultado (lo propio de esta fuente);
    // si no hay resultado explícito, lo deja en null aunque haya sentencia,
    // porque "sentencia firme" puede ser absolutoria.
    const resultado = mapValue(
      pick(row, COLS.caso.resultado),
      RESULTADO_DICT,
      'respuesta_estatal.hubo_condena',
      warn,
      ctx,
    );
    const huboCondena = resultado === 'condena' ? true : resultado === 'absolucion' ? false : null;
    if (huboCondena === true) conCondena++;

    const fechaSentencia = toISODate(pick(row, COLS.caso.fecha_sentencia));
    if (fechaSentencia) conSentencia++;

    const completo: CasoReportadoCompleto = {
      caso_reportado: {
        fuente_id: RNFJA_SENTENCIAS_FUENTE.id,
        id_externo: idExterno,
        clasificacion_fuente: 'femicidio directo (Observatorio de Sentencias OM-CSJN)',
        tipologia_unodc: tipologia,
        criterios_unodc: {
          objetivo: true,
          subjetivo: true,
          legal: true,
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
        nacionalidad: null,
        embarazo: null,
        discapacidad: null,
        desaparicion_previa: null,
        hijos_a_cargo: null,
        pueblo_originario: null,
        notas: null,
      },
      sujetos_activos: [
        {
          edad: toInt(pick(row, COLS.sujeto.edad)),
          vinculo,
          agente_estatal: null,
          denuncias_previas: null,
          medida_proteccion_vigente: null,
          suicidio_posterior: null,
          notas: null,
        },
      ],
      hecho: {
        // Esta fuente no describe el modus operandi: trackea el proceso judicial.
        lugar: 'no_informado',
        medio: 'no_informado',
        violencia_sexual: null,
        ensanamiento: null,
        ocultamiento_cuerpo: null,
        contexto_narco_crimen_organizado: null,
        notas: null,
      },
      respuesta_estatal: {
        caratula_judicial: toStr(pick(row, COLS.caso.caratula)),
        // Es femicidio directo (art. 80 inc. 11 CPN) por definición de la fuente.
        agravante_80_inc11: true,
        estado_causa: estadoCausa,
        hubo_condena: huboCondena,
        pena: toStr(pick(row, COLS.caso.pena)),
        fecha_sentencia: fechaSentencia,
        notas: null,
      },
    };

    casos.push(completo);
  });

  return {
    fuente: RNFJA_SENTENCIAS_FUENTE,
    publicacion: input.publicacion,
    casos,
    warnings: warn.all(),
    resumen_warnings: warn.resumen(),
    stats: {
      filas: input.rows.length,
      casos_producidos: casos.length,
      con_condena: conCondena,
      con_sentencia: conSentencia,
    },
  };
}
