# Estándar Rosetta — Argentina

**Versión 0.1 (semilla)** · Documento de trabajo · Licencia sugerida: CC BY 4.0 (texto) + datos bajo licencia abierta (ODbL o CC0 según se acuerde)

> El nombre es provisorio. Esto es una **semilla para validar con especialistas**, no un estándar cerrado. Las decisiones marcadas con ⚠️ requieren validación del campo antes de congelarse.

---

## 1. Qué es y qué NO es

**Es** una especificación de datos abierta para que múltiples fuentes —estatales y de la sociedad civil— registren femicidios de forma **comparable e interoperable**, sin perder la metodología propia de cada una.

**No es** un nuevo conteo. El problema del campo en Argentina no es la falta de datos sino su fragmentación: la Corte (RNFJA), la Defensoría (OFDPN), La Casa del Encuentro y Ahora Que Sí Nos Ven miden con definiciones y métodos distintos, y por eso los totales no cierran entre sí. Este estándar **no resuelve esa discrepancia inventando un número propio**; la vuelve legible.

### El principio de diseño que lo sostiene

El modelo almacena **afirmaciones de una fuente sobre un caso** (`caso_reportado`), no "casos como verdad". Cada fuente conserva:

- su **definición** de femicidio,
- su **método** de recolección,
- su **clasificación** de cada caso,
- y por lo tanto su **conteo**.

Una capa de reconciliación (`caso_unificado`) vincula las afirmaciones que refieren al **mismo hecho real**, sin borrarlas ni promediarlas. Resultado: se puede ver el solapamiento y la discrepancia entre fuentes **sin obligar a un total único**.

---

## 2. Principios

1. **Pluralidad de fuentes, no fuente única.** Ninguna fuente es "la verdad". Toda cifra es siempre _cifra-según-fuente-X_.
2. **Procedencia primero (provenance-first).** Ningún dato existe sin su fuente, su publicación versionada y su fecha de corte.
3. **Resiliente al retiro estatal.** Datos abiertos, versionados, espejables y archivables. Si un organismo deja de medir o intenta borrar la categoría, el estándar y los datos históricos sobreviven fuera de su control.
4. **Alineado a un marco internacional.** Variables y tipología basadas en el _Marco estadístico para medir el homicidio de mujeres y niñas por razones de género_ (UNODC / ONU Mujeres, aprobado por la Comisión de Estadística de la ONU, 2022), que se ajusta a la ICCS y aplica con independencia de la legislación nacional. Esto da comparabilidad regional y legitimidad técnica gratis.
5. **Dignidad del dato.** Las víctimas son personas, no filas. Ver §7.
6. **Auditable.** Toda reconciliación entre fuentes deja rastro: método, confianza y revisor humano.

---

## 3. Marco conceptual (UNODC/CEPAL 2022)

Un femicidio, a fines estadísticos, es un homicidio que cumple cuatro criterios:

1. **Objetivo:** muerte de una mujer causada por otra persona.
2. **Subjetivo:** intención de matar o causar daño grave.
3. **Legal:** ilegalidad del hecho.
4. **Motivación por razones de género:** causas estructurales (roles estereotipados, control/poder masculino, castigo a un comportamiento "no femenino"). _No_ se refiere a la intención subjetiva del autor sino a las causas subyacentes.

"Mujer" comprende a **toda víctima que se considere a sí misma mujer, haya obtenido o no reconocimiento legal de su identidad de género** — esto incluye explícitamente travesticidios/transfemicidios, hoy fuertemente subregistrados.

### Tipología base (campo `tipologia_unodc`)

- `intimo_pareja` — autor es pareja o expareja.
- `familiar` — autor es familiar (no pareja).
- `otro` — fuera de relación íntima/familiar (comunitario, sexual, trata, prejuicio, etc.).
- `no_determinado` — sin información suficiente.

⚠️ La tipología fina del Marco es más extensa; esto es el primer corte. Las categorías locales argentinas (femicidio vinculado, suicidio feminicida, instigación al suicidio, narco-criminalidad) se modelan como **extensiones** sobre la clasificación de fuente, no reemplazan la tipología UNODC (ver `caso_reportado.clasificacion_fuente`).

### Cuatro dominios de variables

Toda la riqueza de cada caso se organiza en: **víctima**, **autor (sujeto activo)**, **modus operandi / hecho**, y **contexto situacional**, más un quinto bloque transversal: **respuesta del Estado**.

---

## 4. Modelo de datos

```
fuente ──< publicacion ──< caso_reportado >── caso_unificado
                                │
                                ├──1:1── victima
                                ├──1:N── sujeto_activo
                                ├──1:1── hecho
                                └──1:1── respuesta_estatal
```

- **`fuente`**: cada registro/observatorio y su metodología.
- **`publicacion`**: cada dataset versionado que publica una fuente (corte temporal + hash).
- **`caso_reportado`**: la unidad atómica. _Una fuente afirma un caso._ Todo conteo se calcula sumando aquí, filtrado por fuente.
- **`caso_unificado`**: agrupa `caso_reportado` co-referentes (mismo hecho real) **sin fusionarlos**.
- **`vinculo_caso`**: la reconciliación auditable entre lo reportado y lo unificado.

---

## 5. Esquema canónico (PostgreSQL)

> Pensado para Supabase/Postgres. Los `ENUM` se declaran como tipos para forzar vocabularios controlados (clave para la comparabilidad). Campos `*_no_informado` se evitan usando `NULL` = no informado, con una convención documentada.

```sql
-- ============ VOCABULARIOS CONTROLADOS ============

CREATE TYPE tipo_fuente AS ENUM (
  'estatal_judicial', 'estatal_ejecutivo', 'sociedad_civil',
  'academico', 'internacional'
);

CREATE TYPE metodo_recoleccion AS ENUM (
  'registro_judicial', 'registro_administrativo',
  'monitoreo_medios', 'mixto'
);

CREATE TYPE tipologia_unodc AS ENUM (
  'intimo_pareja', 'familiar', 'otro', 'no_determinado'
);

CREATE TYPE identidad_genero AS ENUM (
  'mujer_cis', 'mujer_trans_travesti', 'otra', 'no_informada'
);

CREATE TYPE vinculo_autor AS ENUM (
  'pareja', 'expareja', 'otra_relacion_afectiva',
  'familiar', 'conocido', 'desconocido', 'no_informado'
);

CREATE TYPE lugar_hecho AS ENUM (
  'vivienda_victima', 'vivienda_compartida', 'vivienda_autor',
  'espacio_publico', 'lugar_trabajo', 'otro', 'no_informado'
);

CREATE TYPE medio_comisivo AS ENUM (
  'arma_fuego', 'arma_blanca', 'fuerza_fisica', 'asfixia',
  'fuego', 'veneno', 'otro', 'no_informado'
);

CREATE TYPE metodo_match AS ENUM (
  'deterministico', 'probabilistico', 'manual'
);

-- ============ PROCEDENCIA ============

CREATE TABLE fuente (
  id               TEXT PRIMARY KEY,              -- ej: 'rnfja', 'ofdpn', 'aqsnv'
  nombre           TEXT NOT NULL,
  tipo             tipo_fuente NOT NULL,
  metodo           metodo_recoleccion NOT NULL,
  definicion_base  TEXT NOT NULL,                 -- qué definición usa, en sus palabras
  -- qué categorías cuenta esta fuente (vocabulario abierto, documentado):
  alcance_categorias TEXT[] NOT NULL,             -- ej: {femicidio_directo, vinculado,
                                                  --       travesticidio, suicidio_feminicida}
  alineado_unodc   BOOLEAN,                       -- declara alineación al Marco 2022
  url              TEXT,
  licencia_datos   TEXT,
  contacto         TEXT,
  notas            TEXT
);

CREATE TABLE publicacion (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuente_id        TEXT NOT NULL REFERENCES fuente(id),
  periodo_inicio   DATE NOT NULL,
  periodo_fin      DATE NOT NULL,
  fecha_publicacion DATE NOT NULL,
  version          TEXT NOT NULL,                 -- las cifras se actualizan: versionar es obligatorio
  url_datos        TEXT,
  formato          TEXT,                          -- csv, xlsx, pdf, api...
  hash_sha256      TEXT,                          -- integridad del dataset descargado
  UNIQUE (fuente_id, periodo_inicio, periodo_fin, version)
);

-- ============ AFIRMACIÓN: un caso SEGÚN una fuente ============

CREATE TABLE caso_reportado (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuente_id        TEXT NOT NULL REFERENCES fuente(id),
  publicacion_id   UUID NOT NULL REFERENCES publicacion(id),
  id_externo       TEXT,                          -- id propio de la fuente, si lo tiene

  -- Cómo lo clasificó LA FUENTE (preserva su vocabulario, no el nuestro):
  clasificacion_fuente TEXT NOT NULL,             -- ej: 'femicidio directo',
                                                  --     'travesticidio', 'suicidio feminicida'

  -- Lectura normalizada al Marco UNODC (puede diferir de la clasificación de la fuente):
  tipologia_unodc  tipologia_unodc NOT NULL DEFAULT 'no_determinado',
  criterios_unodc  JSONB,                         -- {objetivo:true, subjetivo:true,
                                                  --  legal:true, motivacion_genero:'presunta'}

  fecha_hecho      DATE,
  jurisdiccion     TEXT,                          -- provincia / depto judicial (ISO-3166-2:AR ideal)
  localidad        TEXT,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fuente_id, publicacion_id, id_externo)
);

-- ============ DOMINIO: VÍCTIMA ============

CREATE TABLE victima (
  caso_reportado_id UUID PRIMARY KEY REFERENCES caso_reportado(id) ON DELETE CASCADE,
  edad             SMALLINT,
  rango_etario     TEXT,                          -- si la fuente sólo publica rango
  identidad        identidad_genero NOT NULL DEFAULT 'no_informada',
  nacionalidad     TEXT,
  embarazo         BOOLEAN,
  discapacidad     BOOLEAN,
  desaparicion_previa BOOLEAN,
  hijos_a_cargo    SMALLINT,                      -- nº de hijos/as (para Ley Brisa, reparación)
  pueblo_originario BOOLEAN,
  notas            TEXT
);

-- ============ DOMINIO: AUTOR (puede haber varios por caso) ============

CREATE TABLE sujeto_activo (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_reportado_id UUID NOT NULL REFERENCES caso_reportado(id) ON DELETE CASCADE,
  edad             SMALLINT,
  vinculo          vinculo_autor NOT NULL DEFAULT 'no_informado',
  agente_estatal   BOOLEAN,                       -- fuerza de seguridad / arma reglamentaria
  denuncias_previas BOOLEAN,
  medida_proteccion_vigente BOOLEAN,              -- había restricción al momento del hecho
  suicidio_posterior BOOLEAN,
  notas            TEXT
);

-- ============ DOMINIO: HECHO (modus operandi + contexto) ============

CREATE TABLE hecho (
  caso_reportado_id UUID PRIMARY KEY REFERENCES caso_reportado(id) ON DELETE CASCADE,
  lugar            lugar_hecho NOT NULL DEFAULT 'no_informado',
  medio            medio_comisivo NOT NULL DEFAULT 'no_informado',
  violencia_sexual BOOLEAN,
  ensanamiento     BOOLEAN,
  ocultamiento_cuerpo BOOLEAN,
  contexto_narco_crimen_organizado BOOLEAN,       -- categoría local relevante (OFDPN 2023+)
  notas            TEXT
);

-- ============ DOMINIO: RESPUESTA DEL ESTADO ============

CREATE TABLE respuesta_estatal (
  caso_reportado_id UUID PRIMARY KEY REFERENCES caso_reportado(id) ON DELETE CASCADE,
  caratula_judicial TEXT,
  agravante_80_inc11 BOOLEAN,                     -- femicidio (art. 80 inc. 11 CPN)
  estado_causa     TEXT,                          -- en investigación / elevada / con sentencia...
  hubo_condena     BOOLEAN,
  pena             TEXT,
  fecha_sentencia  DATE,
  notas            TEXT
);

-- ============ RECONCILIACIÓN entre fuentes ============

CREATE TABLE caso_unificado (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etiqueta         TEXT,                          -- referencia humana, NO identificatoria de la víctima
  fecha_hecho      DATE,
  jurisdiccion     TEXT,
  estado_reconciliacion TEXT NOT NULL DEFAULT 'automatico', -- automatico|revisado|en_disputa
  notas            TEXT
);

CREATE TABLE vinculo_caso (
  caso_reportado_id UUID NOT NULL REFERENCES caso_reportado(id) ON DELETE CASCADE,
  caso_unificado_id UUID NOT NULL REFERENCES caso_unificado(id) ON DELETE CASCADE,
  metodo           metodo_match NOT NULL,
  confianza        NUMERIC(3,2),                  -- 0.00–1.00 para matches probabilísticos
  revisado_por     TEXT,                          -- humano que validó, si aplica
  revisado_en      TIMESTAMPTZ,
  PRIMARY KEY (caso_reportado_id, caso_unificado_id)
);
```

---

## 6. Cómo se cuenta (y por qué nunca hay "un" total)

El conteo **siempre** es por fuente. Nunca se suma a través de fuentes (eso duplicaría hechos reales reportados por varias).

```sql
-- Víctimas directas según CADA fuente, 2025
SELECT f.nombre, count(*) AS victimas
FROM caso_reportado c
JOIN fuente f ON f.id = c.fuente_id
JOIN publicacion p ON p.id = c.publicacion_id
WHERE p.periodo_inicio >= '2025-01-01'
  AND c.clasificacion_fuente ILIKE '%directo%'   -- según vocabulario de la fuente
GROUP BY f.nombre;
```

La capa `caso_unificado` sirve para **análisis de discrepancia**, no para producir un total:

```sql
-- Hechos reales captados por una sola fuente vs. por varias
SELECT count(DISTINCT vc.caso_reportado_id) FILTER (...) ...
-- (revela qué fuente capta casos que otras pierden: el verdadero aporte a "estadísticas limpias")
```

Ese análisis —"qué casos ve AQSNV que no ve la Corte, y viceversa"— es justo lo que hoy **nadie publica de forma sistemática** y lo que vuelve esto valioso para especialistas.

---

## 7. Dignidad y privacidad del dato

- **Sin datos identificatorios por defecto** en la capa pública: nombre, DNI, domicilio exacto y fotos quedan fuera del modelo abierto. La `etiqueta` de `caso_unificado` es una referencia interna, no el nombre de la víctima.
- **Riesgo de reidentificación por agregación:** aunque cada fuente sea pública, cruzar edad + localidad + fecha puede reidentificar. Definir un umbral de generalización (ej. localidad → departamento si N pequeño) **con especialistas**. ⚠️
- **Memoria vs. exposición:** algunos observatorios sí nombran a las víctimas como acto político de memoria. El estándar debe permitir una **capa de memoria opcional y separada**, gobernada por quien tenga legitimidad para hacerlo, nunca por defecto en los datos crudos.

---

## 8. Resiliencia (diseño anti-borrado)

- Datos publicados como **archivos planos versionados** (CSV/Parquet + JSON Schema) además de la DB.
- **Espejos** en múltiples ubicaciones (repos Git, IPFS/archive opcional).
- Cada `publicacion` lleva `hash_sha256`: cualquiera puede verificar que un dataset histórico no fue alterado.
- El estándar es **independiente de cualquier organismo**: si el RNFJA o el OFDPN dejan de publicar, sus datos históricos ya capturados permanecen y el esquema sigue válido para quien siga midiendo.

---

## 9. Lo que NO está decidido (validar con el campo) ⚠️

1. Tipología fina completa del Marco UNODC (acá hay un corte mínimo).
2. Mapeo exacto de cada categoría local (vinculado, suicidio feminicida, instigación al suicidio, narco) a la tipología UNODC.
3. Umbrales de generalización geográfica para privacidad.
4. Vocabulario de `estado_causa` (depende de las prácticas procesales por jurisdicción).
5. Gobernanza: quién custodia el estándar, quién aprueba cambios de versión, cómo entran nuevas fuentes.

---

## 10. Próximos pasos

1. **Validar este v0.1 con al menos un observatorio** antes de tocar más código. El mapeo entre fuentes tiene decisiones que sólo el campo puede tomar.
2. Descargar un dataset real (datos abiertos del RNFJA) y escribir el **primer adaptador** que lo normalice a `caso_reportado`. Eso prueba el modelo contra la realidad y expone los gaps de mapeo.
3. Repetir con una fuente de método distinto (AQSNV, monitoreo de medios) — ahí aparece la fricción real de comparabilidad, que es el corazón del proyecto.
4. Recién entonces: explorador público que muestre las fuentes lado a lado, cada una con su metodología visible.

---

_Basado en: UNODC / ONU Mujeres, "Marco estadístico para medir el homicidio de mujeres y niñas por razones de género (femicidio/feminicidio)", aprobado por la Comisión de Estadística de la ONU, 2022._
