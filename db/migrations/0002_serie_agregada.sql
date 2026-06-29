-- 0002_serie_agregada.sql
-- Capa de REFERENCIA AGREGADA. Algunas fuentes (ej. SNIC, issue #2) publican
-- sólo tasas agregadas por jurisdicción/año, no hechos individuales. Forzarlas
-- a caso_reportado inventaría casos, lo que el estándar prohíbe (ver
-- docs/estandar-v0.1.md §1 y §6). Viven acá, separadas del modelo per-case, y
-- se usan para VALIDACIÓN CRUZADA, nunca para el conteo de víctimas.

-- Reusa la tabla `fuente` (una fuente de referencia es una fuente con método
-- 'registro_administrativo' y sin casos asociados). `serie_agregada` referencia
-- a `fuente` y a una `publicacion` versionada, igual que caso_reportado.

CREATE TABLE serie_agregada (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuente_id      TEXT NOT NULL REFERENCES fuente(id),
  publicacion_id UUID REFERENCES publicacion(id),
  indicador      TEXT NOT NULL,            -- ej: 'tasa_homicidios_dolosos'
  unidad         TEXT NOT NULL,            -- ej: 'tasa_100k'
  jurisdiccion   TEXT,                     -- provincia canónica; NULL = total país
  anio           SMALLINT NOT NULL,
  valor          NUMERIC,                  -- NULL = punto sin dato
  categoria      TEXT,                     -- categoría penal / sub-serie, si aplica
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- NULLS NOT DISTINCT: el total país viaja con jurisdiccion = NULL (y muchas
  -- series sin sub-categoría, categoria = NULL). Esos NULL son una clave real y
  -- recurrente, no "valores desconocidos distintos". Sin esto, la etapa de load
  -- duplicaría el punto de total país en cada recarga (el UPSERT no detectaría
  -- el conflicto). Requiere PostgreSQL 15+ (Supabase/Neon/Postgres 16 lo cumplen).
  UNIQUE NULLS NOT DISTINCT (fuente_id, indicador, jurisdiccion, anio, categoria)
);

COMMENT ON TABLE serie_agregada IS
  'Datos agregados de referencia (tasas por jurisdicción/año). NO son casos: '
  'no se suman al conteo per-case ni entran en la reconciliación. Sirven para '
  'contrastar las tasas oficiales contra lo que captan las fuentes per-case.';
