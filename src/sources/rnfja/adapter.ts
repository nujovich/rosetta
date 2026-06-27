// sources/rnfja/adapter.ts
// Toma las 3 bases del RNFJA (causa, víctima, sujeto activo) ya leídas como
// filas, las une por la clave de causa y produce un CasoReportadoCompleto por
// VÍCTIMA (porque el conteo de referencia es "víctimas directas").

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
  normalizeLabel,
} from '../../core/harmonize.js';
import {
  RNFJA_FUENTE,
  JOIN_KEY,
  COLS,
  IDENTIDAD_DICT,
  VINCULO_DICT,
  LUGAR_DICT,
  MEDIO_DICT,
  ESTADO_DICT,
} from './mapping.js';

export interface RnfjaInput {
  causaRows: RawRow[];
  victimaRows: RawRow[];
  sujetoRows: RawRow[];
  publicacion: Publicacion;
}

export interface RnfjaOutput {
  fuente: typeof RNFJA_FUENTE;
  publicacion: Publicacion;
  casos: CasoReportadoCompleto[];
  warnings: ReturnType<WarningSink['all']>;
  resumen_warnings: ReturnType<WarningSink['resumen']>;
  stats: {
    causas: number;
    victimas: number;
    sujetos: number;
    causas_sin_victima: number;
    sujetos_sin_causa: number;
  };
}

function joinId(row: RawRow, aliases: string[]): string | null {
  const v = pick(row, aliases);
  return v == null ? null : String(v).trim();
}

// La tipología UNODC se deriva del vínculo víctima–autor (no de la etiqueta legal).
function tipologiaDesdeVinculos(vinculos: VinculoAutor[]): TipologiaUnodc {
  if (vinculos.some((v) => v === 'pareja' || v === 'expareja' || v === 'otra_relacion_afectiva'))
    return 'intimo_pareja';
  if (vinculos.some((v) => v === 'familiar')) return 'familiar';
  if (vinculos.some((v) => v === 'conocido' || v === 'desconocido')) return 'otro';
  return 'no_determinado';
}

export function adaptRnfja(input: RnfjaInput): RnfjaOutput {
  const warn = new WarningSink(RNFJA_FUENTE.id);

  // Indexar sujetos por causa
  const sujetosPorCausa = new Map<string, RawRow[]>();
  let sujetosSinCausa = 0;
  for (const r of input.sujetoRows) {
    const cid = joinId(r, JOIN_KEY.sujeto);
    if (!cid) {
      sujetosSinCausa++;
      continue;
    }
    (sujetosPorCausa.get(cid) ?? sujetosPorCausa.set(cid, []).get(cid)!).push(r);
  }

  // Indexar causas por id
  const causaPorId = new Map<string, RawRow>();
  for (const r of input.causaRows) {
    const cid = joinId(r, JOIN_KEY.causa);
    if (cid) causaPorId.set(cid, r);
  }

  const casos: CasoReportadoCompleto[] = [];
  let causasSinVictima = 0;
  const causasConVictima = new Set<string>();

  // Iterar VÍCTIMAS: cada una es un caso_reportado
  input.victimaRows.forEach((vrow, idx) => {
    const cid = joinId(vrow, JOIN_KEY.victima) ?? `sin_causa_${idx}`;
    causasConVictima.add(cid);
    const causa = causaPorId.get(cid) ?? {};
    const sujetosRaw = sujetosPorCausa.get(cid) ?? [];
    const ctx = `causa=${cid} victima#${idx}`;

    // --- sujetos activos ---
    const sujetos = sujetosRaw.map((s) => {
      const vinculo = mapValue(
        pick(s, COLS.sujeto.vinculo),
        VINCULO_DICT,
        'sujeto_activo.vinculo',
        warn,
        ctx,
      );
      return {
        edad: toInt(pick(s, COLS.sujeto.edad)),
        vinculo,
        agente_estatal: toBool(pick(s, COLS.sujeto.agente_estatal)),
        denuncias_previas: null,
        medida_proteccion_vigente: null,
        suicidio_posterior: toBool(pick(s, COLS.sujeto.suicidio_posterior)),
        notas: null,
      };
    });

    const tipologia = tipologiaDesdeVinculos(sujetos.map((s) => s.vinculo));

    // --- clasificación de la fuente (preserva su vocabulario) ---
    const tipoRaw = toStr(pick(causa, COLS.causa.tipo_femicidio));
    const clasificacion_fuente = tipoRaw ? tipoRaw : 'femicidio (RNFJA)'; // base de femicidio directo por defecto

    // --- estado procesal -> respuesta estatal ---
    const estadoRaw =
      pick(causa, COLS.causa.estado_causa) ??
      (sujetosRaw.length ? pick(sujetosRaw[0], COLS.sujeto.estado_procesal) : null);
    const estado_causa = mapValue(
      estadoRaw,
      ESTADO_DICT,
      'respuesta_estatal.estado_causa',
      warn,
      ctx,
    );
    const hubo_condena =
      estado_causa === 'sentencia_firme'
        ? true
        : estado_causa === 'sentencia_no_firme'
          ? true
          : null;

    const completo: CasoReportadoCompleto = {
      caso_reportado: {
        fuente_id: RNFJA_FUENTE.id,
        id_externo: `${cid}::v${idx}`,
        clasificacion_fuente,
        tipologia_unodc: tipologia,
        // La inclusión en el RNFJA implica presunción de motivación de género.
        criterios_unodc: {
          objetivo: true,
          subjetivo: true,
          legal: true,
          motivacion_genero: 'presunta_registro',
        },
        fecha_hecho: toISODate(pick(causa, COLS.causa.fecha_hecho)),
        jurisdiccion: toStr(pick(causa, COLS.causa.jurisdiccion)),
        localidad: toStr(pick(causa, COLS.causa.localidad)),
      },
      victima: {
        edad: toInt(pick(vrow, COLS.victima.edad)),
        rango_etario: null,
        identidad: mapValue(
          pick(vrow, COLS.victima.identidad),
          IDENTIDAD_DICT,
          'victima.identidad',
          warn,
          ctx,
        ),
        nacionalidad: toStr(pick(vrow, COLS.victima.nacionalidad)),
        embarazo: toBool(pick(vrow, COLS.victima.embarazo)),
        discapacidad: toBool(pick(vrow, COLS.victima.discapacidad)),
        desaparicion_previa: null,
        hijos_a_cargo: toInt(pick(vrow, COLS.victima.hijos_a_cargo)),
        pueblo_originario: toBool(pick(vrow, COLS.victima.pueblo_originario)),
        notas: null,
      },
      sujetos_activos: sujetos,
      hecho: {
        lugar: mapValue(pick(causa, COLS.causa.lugar), LUGAR_DICT, 'hecho.lugar', warn, ctx),
        medio: mapValue(pick(causa, COLS.causa.medio), MEDIO_DICT, 'hecho.medio', warn, ctx),
        violencia_sexual: toBool(pick(causa, COLS.causa.violencia_sexual)),
        ensanamiento: null,
        ocultamiento_cuerpo: null,
        contexto_narco_crimen_organizado: null,
        notas: null,
      },
      respuesta_estatal: {
        caratula_judicial: null,
        agravante_80_inc11: normalizeLabel(clasificacion_fuente).includes('directo') ? true : null,
        estado_causa,
        hubo_condena,
        pena: null,
        fecha_sentencia: null,
        notas: null,
      },
    };

    casos.push(completo);
  });

  // causas sin ninguna víctima asociada (posible gap de join)
  for (const cid of causaPorId.keys()) {
    if (!causasConVictima.has(cid)) causasSinVictima++;
  }

  return {
    fuente: RNFJA_FUENTE,
    publicacion: input.publicacion,
    casos,
    warnings: warn.all(),
    resumen_warnings: warn.resumen(),
    stats: {
      causas: input.causaRows.length,
      victimas: input.victimaRows.length,
      sujetos: input.sujetoRows.length,
      causas_sin_victima: causasSinVictima,
      sujetos_sin_causa: sujetosSinCausa,
    },
  };
}
