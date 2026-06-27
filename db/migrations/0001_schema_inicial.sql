-- 0001_schema_inicial.sql
-- Esquema canónico del Estándar Abierto de Datos de Femicidios (v0.1).
-- Ver docs/estandar-v0.1.md para el racional. Pensado para PostgreSQL/Supabase.

-- ===== Vocabularios controlados =====
CREATE TYPE tipo_fuente AS ENUM ('estatal_judicial','estatal_ejecutivo','sociedad_civil','academico','internacional');
CREATE TYPE metodo_recoleccion AS ENUM ('registro_judicial','registro_administrativo','monitoreo_medios','mixto');
CREATE TYPE tipologia_unodc AS ENUM ('intimo_pareja','familiar','otro','no_determinado');
CREATE TYPE identidad_genero AS ENUM ('mujer_cis','mujer_trans_travesti','otra','no_informada');
CREATE TYPE vinculo_autor AS ENUM ('pareja','expareja','otra_relacion_afectiva','familiar','conocido','desconocido','no_informado');
CREATE TYPE lugar_hecho AS ENUM ('vivienda_victima','vivienda_compartida','vivienda_autor','espacio_publico','lugar_trabajo','otro','no_informado');
CREATE TYPE medio_comisivo AS ENUM ('arma_fuego','arma_blanca','fuerza_fisica','asfixia','fuego','veneno','otro','no_informado');
CREATE TYPE estado_causa AS ENUM ('etapa_investigacion','etapa_juicio','sentencia_no_firme','sentencia_firme','extincion_accion','otros_estados','no_informado');
CREATE TYPE metodo_match AS ENUM ('deterministico','probabilistico','manual');

-- ===== Procedencia =====
CREATE TABLE fuente (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo tipo_fuente NOT NULL,
  metodo metodo_recoleccion NOT NULL,
  definicion_base TEXT NOT NULL,
  alcance_categorias TEXT[] NOT NULL,
  alineado_unodc BOOLEAN,
  url TEXT, licencia_datos TEXT, contacto TEXT, notas TEXT
);

CREATE TABLE publicacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuente_id TEXT NOT NULL REFERENCES fuente(id),
  periodo_inicio DATE NOT NULL, periodo_fin DATE NOT NULL,
  fecha_publicacion DATE NOT NULL, version TEXT NOT NULL,
  url_datos TEXT, formato TEXT, hash_sha256 TEXT,
  UNIQUE (fuente_id, periodo_inicio, periodo_fin, version)
);

-- ===== Afirmación: un caso SEGÚN una fuente =====
CREATE TABLE caso_reportado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuente_id TEXT NOT NULL REFERENCES fuente(id),
  publicacion_id UUID NOT NULL REFERENCES publicacion(id),
  id_externo TEXT,
  clasificacion_fuente TEXT NOT NULL,
  tipologia_unodc tipologia_unodc NOT NULL DEFAULT 'no_determinado',
  criterios_unodc JSONB,
  fecha_hecho DATE, jurisdiccion TEXT, localidad TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fuente_id, publicacion_id, id_externo)
);

CREATE TABLE victima (
  caso_reportado_id UUID PRIMARY KEY REFERENCES caso_reportado(id) ON DELETE CASCADE,
  edad SMALLINT, rango_etario TEXT,
  identidad identidad_genero NOT NULL DEFAULT 'no_informada',
  nacionalidad TEXT, embarazo BOOLEAN, discapacidad BOOLEAN,
  desaparicion_previa BOOLEAN, hijos_a_cargo SMALLINT,
  pueblo_originario BOOLEAN, notas TEXT
);

CREATE TABLE sujeto_activo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_reportado_id UUID NOT NULL REFERENCES caso_reportado(id) ON DELETE CASCADE,
  edad SMALLINT, vinculo vinculo_autor NOT NULL DEFAULT 'no_informado',
  agente_estatal BOOLEAN, denuncias_previas BOOLEAN,
  medida_proteccion_vigente BOOLEAN, suicidio_posterior BOOLEAN, notas TEXT
);

CREATE TABLE hecho (
  caso_reportado_id UUID PRIMARY KEY REFERENCES caso_reportado(id) ON DELETE CASCADE,
  lugar lugar_hecho NOT NULL DEFAULT 'no_informado',
  medio medio_comisivo NOT NULL DEFAULT 'no_informado',
  violencia_sexual BOOLEAN, ensanamiento BOOLEAN, ocultamiento_cuerpo BOOLEAN,
  contexto_narco_crimen_organizado BOOLEAN, notas TEXT
);

CREATE TABLE respuesta_estatal (
  caso_reportado_id UUID PRIMARY KEY REFERENCES caso_reportado(id) ON DELETE CASCADE,
  caratula_judicial TEXT, agravante_80_inc11 BOOLEAN, estado_causa estado_causa,
  hubo_condena BOOLEAN, pena TEXT, fecha_sentencia DATE, notas TEXT
);

-- ===== Reconciliación (sin fusionar) =====
CREATE TABLE caso_unificado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etiqueta TEXT, fecha_hecho DATE, jurisdiccion TEXT,
  estado_reconciliacion TEXT NOT NULL DEFAULT 'automatico', notas TEXT
);

CREATE TABLE vinculo_caso (
  caso_reportado_id UUID NOT NULL REFERENCES caso_reportado(id) ON DELETE CASCADE,
  caso_unificado_id UUID NOT NULL REFERENCES caso_unificado(id) ON DELETE CASCADE,
  metodo metodo_match NOT NULL, confianza NUMERIC(3,2),
  revisado_por TEXT, revisado_en TIMESTAMPTZ,
  PRIMARY KEY (caso_reportado_id, caso_unificado_id)
);
