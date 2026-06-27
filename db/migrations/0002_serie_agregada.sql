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
  UNIQUE (fuente_id, indicador, jurisdiccion, anio, categoria)
);

COMMENT ON TABLE serie_agregada IS
  'Datos agregados de referencia (tasas por jurisdicción/año). NO son casos: '
  'no se suman al conteo per-case ni entran en la reconciliación. Sirven para '
  'contrastar las tasas oficiales contra lo que captan las fuentes per-case.';
