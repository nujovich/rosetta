// sources/snic/mapping.ts
// Sistema Nacional de Información Criminal (SNIC) — Dirección Nacional de
// Estadística Criminal, Ministerio de Seguridad. Publicado vía la API de
// series de tiempo de datos.gob.ar.
//
// ⚠️ El SNIC publica TASAS AGREGADAS (cada 100.000 hab.) por provincia y año,
// NO datos por caso. Por eso NO produce caso_reportado: alimenta el registry
// de referencia (core/reference.ts) para validación cruzada provincial. Ver
// la nota de issue #2: "Fuente de referencia para el pipeline de validación,
// no fuente de caso_reportado".

import { normalizeLabel } from '../../core/harmonize.js';

export const SNIC_FUENTE = {
  id: 'snic',
  nombre: 'Sistema Nacional de Información Criminal (SNIC) — Min. de Seguridad',
  tipo: 'estatal_ejecutivo',
  metodo: 'registro_administrativo',
  definicion_base:
    'Tasas de hechos delictivos registrados por las fuerzas policiales y de ' +
    'seguridad de cada jurisdicción, consolidadas por la Dirección Nacional ' +
    'de Estadística Criminal. Para femicidios, la serie relevante es la tasa ' +
    'de homicidios dolosos de mujeres por provincia (cada 100.000 hab.). NO ' +
    'es un registro por caso de femicidios.',
  indicador: 'tasa_homicidios_dolosos',
  unidad: 'tasa_100k',
  alcance_categorias: ['homicidios_dolosos'],
  cita_obligatoria:
    'Fuente: Sistema Nacional de Información Criminal (SNIC), Dirección ' +
    'Nacional de Estadística Criminal, Ministerio de Seguridad de la Nación ' +
    '(datos.gob.ar).',
  no_apto_caso_reportado:
    'Publica tasas agregadas por provincia/año, no hechos individuales. Se ' +
    'usa como referencia de validación cruzada, nunca como conteo per-case.',
};

// Acepta el CSV "tidy" de la serie (1 fila por provincia/año) o la exportación
// de datos.gob.ar. Patrón flexible para encontrarlo en el directorio.
export const FILE_PATTERNS = {
  serie: /snic|serie|homicidi|tasa|datos/i,
};

export const COLS = {
  jurisdiccion: ['provincia', 'jurisdiccion', 'jurisdicción', 'region'],
  anio: ['anio', 'año', 'ano', 'indice_tiempo', 'fecha', 'periodo'],
  valor: ['tasa', 'valor', 'tasa_100k', 'tasa_cada_100000', 'hechos'],
  categoria: ['categoria', 'categoría', 'categoria_penal', 'indicador', 'serie'],
};

// ---- Normalización de provincias argentinas (24 jurisdicciones) ----
// Devuelve el nombre canónico, o null si no se reconoce (el adaptador lo
// manda a warnings; nunca se descarta en silencio).

const PROVINCIAS: Record<string, string> = {};
function reg(canonico: string, ...variantes: string[]) {
  PROVINCIAS[normalizeLabel(canonico)] = canonico;
  for (const v of variantes) PROVINCIAS[normalizeLabel(v)] = canonico;
}

reg('Buenos Aires', 'pcia de buenos aires', 'provincia de buenos aires', 'bs as', 'pba');
reg(
  'Ciudad Autónoma de Buenos Aires',
  'caba',
  'ciudad de buenos aires',
  'capital federal',
  'ciudad autonoma de buenos aires',
);
reg('Catamarca');
reg('Chaco');
reg('Chubut');
reg('Córdoba', 'cordoba');
reg('Corrientes');
reg('Entre Ríos', 'entre rios');
reg('Formosa');
reg('Jujuy');
reg('La Pampa');
reg('La Rioja');
reg('Mendoza');
reg('Misiones');
reg('Neuquén', 'neuquen');
reg('Río Negro', 'rio negro');
reg('Salta');
reg('San Juan');
reg('San Luis');
reg('Santa Cruz');
reg('Santa Fe', 'santa fé');
reg('Santiago del Estero');
reg(
  'Tierra del Fuego',
  'tierra del fuego, antartida e islas del atlantico sur',
  'tierra del fuego (afaias)',
);
reg('Tucumán', 'tucuman');

// Etiquetas que representan el total nacional (jurisdiccion = null, sin warning).
const TOTAL_PAIS = new Set(
  ['total pais', 'total país', 'total nacional', 'nacional', 'argentina', 'total'].map(
    normalizeLabel,
  ),
);

export interface ProvinciaResult {
  jurisdiccion: string | null;
  es_total_pais: boolean;
  reconocida: boolean;
}

export function normalizarProvincia(raw: unknown): ProvinciaResult {
  const key = normalizeLabel(raw);
  if (!key) return { jurisdiccion: null, es_total_pais: false, reconocida: false };
  if (TOTAL_PAIS.has(key)) return { jurisdiccion: null, es_total_pais: true, reconocida: true };
  const hit = PROVINCIAS[key];
  if (hit) return { jurisdiccion: hit, es_total_pais: false, reconocida: true };
  return { jurisdiccion: null, es_total_pais: false, reconocida: false };
}
