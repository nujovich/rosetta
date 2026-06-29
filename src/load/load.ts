// load/load.ts
// Etapa de carga (load): toma la salida del pipeline (lo que produce `run` /
// `run-ref`) y la persiste en Postgres. Es idempotente: re-cargar la misma
// publicación actualiza en vez de duplicar (UPSERT por las claves naturales del
// esquema). No fusiona ni inventa: respeta el modelo "afirmación por fuente"
// (caso_reportado) y la capa de referencia agregada (serie_agregada) tal cual
// salen del pipeline.

import type { Pool, PoolClient } from 'pg';
import type { CasoReportadoCompleto, Publicacion, SujetoActivo } from '../schema.js';
import type { SourceMeta } from '../core/registry.js';
import type { ReferenceMeta, SerieAgregada } from '../core/reference.js';
import { withTransaction } from './db.js';

// La salida del pipeline serializada a JSON (subconjunto que necesita el load).
export interface PerCasePayload {
  fuente: SourceMeta;
  publicacion: Publicacion;
  casos: CasoReportadoCompleto[];
}

export interface ReferencePayload {
  fuente: ReferenceMeta;
  publicacion: Publicacion;
  series: SerieAgregada[];
}

export interface LoadSummary {
  fuente: string;
  publicacion: string;
  caso_reportado: number;
  serie_agregada: number;
}

// Distingue una salida per-case de una de referencia por su forma.
export function esPayloadReferencia(p: unknown): p is ReferencePayload {
  return !!p && typeof p === 'object' && Array.isArray((p as ReferencePayload).series);
}
export function esPayloadPerCase(p: unknown): p is PerCasePayload {
  return !!p && typeof p === 'object' && Array.isArray((p as PerCasePayload).casos);
}

// ---- UPSERTs de procedencia (compartidos por ambos caminos) ----

async function upsertFuente(
  client: PoolClient,
  m: {
    id: string;
    nombre: string;
    tipo: string;
    metodo: string;
    definicion_base: string;
    alcance_categorias: string[];
    alineado_unodc?: boolean;
    cita_obligatoria?: string;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO fuente (id, nombre, tipo, metodo, definicion_base, alcance_categorias, alineado_unodc, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO UPDATE SET
       nombre = EXCLUDED.nombre,
       tipo = EXCLUDED.tipo,
       metodo = EXCLUDED.metodo,
       definicion_base = EXCLUDED.definicion_base,
       alcance_categorias = EXCLUDED.alcance_categorias,
       alineado_unodc = EXCLUDED.alineado_unodc,
       notas = EXCLUDED.notas`,
    [
      m.id,
      m.nombre,
      m.tipo,
      m.metodo,
      m.definicion_base,
      m.alcance_categorias,
      m.alineado_unodc ?? null,
      m.cita_obligatoria ?? null,
    ],
  );
}

async function upsertPublicacion(client: PoolClient, p: Publicacion): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO publicacion
       (fuente_id, periodo_inicio, periodo_fin, fecha_publicacion, version, url_datos, formato, hash_sha256)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (fuente_id, periodo_inicio, periodo_fin, version) DO UPDATE SET
       fecha_publicacion = EXCLUDED.fecha_publicacion,
       url_datos = EXCLUDED.url_datos,
       formato = EXCLUDED.formato,
       hash_sha256 = EXCLUDED.hash_sha256
     RETURNING id`,
    [
      p.fuente_id,
      p.periodo_inicio,
      p.periodo_fin,
      p.fecha_publicacion,
      p.version,
      p.url_datos ?? null,
      p.formato ?? null,
      p.hash_sha256 ?? null,
    ],
  );
  return rows[0].id;
}

// ---- Carga per-case (caso_reportado + dominios) ----

async function upsertCaso(
  client: PoolClient,
  publicacionId: string,
  c: CasoReportadoCompleto,
): Promise<void> {
  const cr = c.caso_reportado;
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO caso_reportado
       (fuente_id, publicacion_id, id_externo, clasificacion_fuente, tipologia_unodc, criterios_unodc, fecha_hecho, jurisdiccion, localidad)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (fuente_id, publicacion_id, id_externo) DO UPDATE SET
       clasificacion_fuente = EXCLUDED.clasificacion_fuente,
       tipologia_unodc = EXCLUDED.tipologia_unodc,
       criterios_unodc = EXCLUDED.criterios_unodc,
       fecha_hecho = EXCLUDED.fecha_hecho,
       jurisdiccion = EXCLUDED.jurisdiccion,
       localidad = EXCLUDED.localidad
     RETURNING id`,
    [
      cr.fuente_id,
      publicacionId,
      cr.id_externo,
      cr.clasificacion_fuente,
      cr.tipologia_unodc,
      JSON.stringify(cr.criterios_unodc),
      cr.fecha_hecho,
      cr.jurisdiccion,
      cr.localidad,
    ],
  );
  const casoId = rows[0].id;

  const v = c.victima;
  await client.query(
    `INSERT INTO victima
       (caso_reportado_id, edad, rango_etario, identidad, nacionalidad, embarazo, discapacidad, desaparicion_previa, hijos_a_cargo, pueblo_originario, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (caso_reportado_id) DO UPDATE SET
       edad = EXCLUDED.edad, rango_etario = EXCLUDED.rango_etario, identidad = EXCLUDED.identidad,
       nacionalidad = EXCLUDED.nacionalidad, embarazo = EXCLUDED.embarazo, discapacidad = EXCLUDED.discapacidad,
       desaparicion_previa = EXCLUDED.desaparicion_previa, hijos_a_cargo = EXCLUDED.hijos_a_cargo,
       pueblo_originario = EXCLUDED.pueblo_originario, notas = EXCLUDED.notas`,
    [
      casoId,
      v.edad,
      v.rango_etario,
      v.identidad,
      v.nacionalidad,
      v.embarazo,
      v.discapacidad,
      v.desaparicion_previa,
      v.hijos_a_cargo,
      v.pueblo_originario,
      v.notas,
    ],
  );

  const h = c.hecho;
  await client.query(
    `INSERT INTO hecho
       (caso_reportado_id, lugar, medio, violencia_sexual, ensanamiento, ocultamiento_cuerpo, contexto_narco_crimen_organizado, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (caso_reportado_id) DO UPDATE SET
       lugar = EXCLUDED.lugar, medio = EXCLUDED.medio, violencia_sexual = EXCLUDED.violencia_sexual,
       ensanamiento = EXCLUDED.ensanamiento, ocultamiento_cuerpo = EXCLUDED.ocultamiento_cuerpo,
       contexto_narco_crimen_organizado = EXCLUDED.contexto_narco_crimen_organizado, notas = EXCLUDED.notas`,
    [
      casoId,
      h.lugar,
      h.medio,
      h.violencia_sexual,
      h.ensanamiento,
      h.ocultamiento_cuerpo,
      h.contexto_narco_crimen_organizado,
      h.notas,
    ],
  );

  const re = c.respuesta_estatal;
  await client.query(
    `INSERT INTO respuesta_estatal
       (caso_reportado_id, caratula_judicial, agravante_80_inc11, estado_causa, hubo_condena, pena, fecha_sentencia, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (caso_reportado_id) DO UPDATE SET
       caratula_judicial = EXCLUDED.caratula_judicial, agravante_80_inc11 = EXCLUDED.agravante_80_inc11,
       estado_causa = EXCLUDED.estado_causa, hubo_condena = EXCLUDED.hubo_condena, pena = EXCLUDED.pena,
       fecha_sentencia = EXCLUDED.fecha_sentencia, notas = EXCLUDED.notas`,
    [
      casoId,
      re.caratula_judicial,
      re.agravante_80_inc11,
      re.estado_causa,
      re.hubo_condena,
      re.pena,
      re.fecha_sentencia,
      re.notas,
    ],
  );

  // sujeto_activo no tiene clave natural (UUID propio). Para que recargar sea
  // idempotente, se reemplazan los sujetos del caso en bloque.
  await client.query('DELETE FROM sujeto_activo WHERE caso_reportado_id = $1', [casoId]);
  for (const s of c.sujetos_activos) {
    await insertSujeto(client, casoId, s);
  }
}

async function insertSujeto(client: PoolClient, casoId: string, s: SujetoActivo): Promise<void> {
  await client.query(
    `INSERT INTO sujeto_activo
       (caso_reportado_id, edad, vinculo, agente_estatal, denuncias_previas, medida_proteccion_vigente, suicidio_posterior, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      casoId,
      s.edad,
      s.vinculo,
      s.agente_estatal,
      s.denuncias_previas,
      s.medida_proteccion_vigente,
      s.suicidio_posterior,
      s.notas,
    ],
  );
}

// ---- Carga de referencia (serie_agregada) ----

async function upsertSerie(
  client: PoolClient,
  publicacionId: string,
  s: SerieAgregada,
): Promise<void> {
  await client.query(
    `INSERT INTO serie_agregada
       (fuente_id, publicacion_id, indicador, unidad, jurisdiccion, anio, valor, categoria)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (fuente_id, indicador, jurisdiccion, anio, categoria) DO UPDATE SET
       publicacion_id = EXCLUDED.publicacion_id,
       unidad = EXCLUDED.unidad,
       valor = EXCLUDED.valor`,
    [
      s.fuente_id,
      publicacionId,
      s.indicador,
      s.unidad,
      s.jurisdiccion,
      s.anio,
      s.valor,
      s.categoria,
    ],
  );
}

// ---- Entradas públicas ----

export async function loadPerCase(pool: Pool, payload: PerCasePayload): Promise<LoadSummary> {
  return withTransaction(pool, async (client) => {
    await upsertFuente(client, payload.fuente);
    const pubId = await upsertPublicacion(client, payload.publicacion);
    for (const c of payload.casos) {
      await upsertCaso(client, pubId, c);
    }
    return {
      fuente: payload.fuente.id,
      publicacion: payload.publicacion.version,
      caso_reportado: payload.casos.length,
      serie_agregada: 0,
    };
  });
}

export async function loadReferencia(pool: Pool, payload: ReferencePayload): Promise<LoadSummary> {
  return withTransaction(pool, async (client) => {
    await upsertFuente(client, payload.fuente);
    const pubId = await upsertPublicacion(client, payload.publicacion);
    for (const s of payload.series) {
      await upsertSerie(client, pubId, s);
    }
    return {
      fuente: payload.fuente.id,
      publicacion: payload.publicacion.version,
      caso_reportado: 0,
      serie_agregada: payload.series.length,
    };
  });
}

// Carga una salida del pipeline (per-case o referencia) detectando su forma.
export async function loadPayload(pool: Pool, payload: unknown): Promise<LoadSummary> {
  if (esPayloadReferencia(payload)) return loadReferencia(pool, payload);
  if (esPayloadPerCase(payload)) return loadPerCase(pool, payload);
  throw new Error('Payload no reconocido: se esperaba un JSON con "casos" o "series".');
}
