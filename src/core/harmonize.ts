// core/harmonize.ts
// Motor genérico de normalización, reutilizable por cualquier fuente.
// La idea: cada fuente declara diccionarios de valores; el motor traduce
// los valores crudos al vocabulario canónico y JUNTA TODO LO QUE NO SABE
// MAPEAR en `warnings`. Esos warnings son el verdadero producto del paso de
// validación: exponen los gaps de mapeo contra el Libro de Códigos.

export type RawRow = Record<string, unknown>;

export interface Warning {
  fuente: string;
  campo: string; // campo canónico afectado
  valor_crudo: string; // valor que no se pudo mapear
  contexto?: string; // id externo / fila, para rastrear
}

export class WarningSink {
  private items: Warning[] = [];
  constructor(public fuente: string) {}

  add(campo: string, valor_crudo: unknown, contexto?: string) {
    this.items.push({
      fuente: this.fuente,
      campo,
      valor_crudo: String(valor_crudo),
      contexto,
    });
  }

  all(): Warning[] {
    return this.items;
  }

  // Resumen agrupado por campo + valor, con conteo. Útil para el reporte.
  resumen(): Array<{ campo: string; valor_crudo: string; n: number }> {
    const map = new Map<string, number>();
    for (const w of this.items) {
      const k = `${w.campo}\u0000${w.valor_crudo}`;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([k, n]) => {
        const [campo, valor_crudo] = k.split('\u0000');
        return { campo, valor_crudo, n };
      })
      .sort((a, b) => b.n - a.n);
  }
}

// Convención de nulo: cadenas que significan "sin dato".
const NULL_TOKENS = new Set([
  '',
  '-',
  '--',
  's/d',
  'sd',
  'sin dato',
  'sin datos',
  'ns/nc',
  'nsnc',
  'no informado',
  'no informada',
  'no consta',
  'n/a',
  'na',
  'null',
]);

export function normalizeLabel(v: unknown): string {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // saca acentos
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function isNull(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  return NULL_TOKENS.has(normalizeLabel(v));
}

export function toStr(v: unknown): string | null {
  if (isNull(v)) return null;
  return String(v).trim();
}

export function toInt(v: unknown): number | null {
  if (isNull(v)) return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

const TRUE_TOKENS = new Set(['si', 'sí', 's', '1', 'true', 'verdadero', 'x']);
const FALSE_TOKENS = new Set(['no', 'n', '0', 'false', 'falso']);

export function toBool(v: unknown): boolean | null {
  if (isNull(v)) return null;
  const t = normalizeLabel(v);
  if (TRUE_TOKENS.has(t)) return true;
  if (FALSE_TOKENS.has(t)) return false;
  return null;
}

export function toISODate(v: unknown): string | null {
  if (isNull(v)) return null;
  if (v instanceof Date && !isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  // dd/mm/yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const yy = y.length === 2 ? `20${y}` : y;
    return `${yy}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

// Diccionario de valores: clave = código numérico (string) o etiqueta
// normalizada; valor = término canónico. Soporta matching por igualdad y,
// como red de seguridad, por "contiene" (para etiquetas largas).
export interface ValueDict<T extends string> {
  exact: Record<string, T>; // '1' -> 'vivienda_victima', o etiqueta exacta
  contains?: Array<[string, T]>; // [substring normalizado, término]
  fallback: T; // término por defecto si no matchea
}

export function mapValue<T extends string>(
  raw: unknown,
  dict: ValueDict<T>,
  campo: string,
  warn: WarningSink,
  contexto?: string,
): T {
  if (isNull(raw)) return dict.fallback;
  const key = normalizeLabel(raw);

  // 1) match exacto por código o etiqueta
  if (key in dict.exact) return dict.exact[key];

  // 2) match por substring (etiquetas verbosas del export con labels)
  if (dict.contains) {
    for (const [sub, term] of dict.contains) {
      if (key.includes(sub)) return term;
    }
  }

  // 3) no se pudo mapear -> warning + fallback (nunca se descarta en silencio)
  warn.add(campo, raw, contexto);
  return dict.fallback;
}

// Lee la primera columna existente entre varios alias posibles.
export function pick(row: RawRow, aliases: string[]): unknown {
  for (const a of aliases) {
    if (a in row && !isNull(row[a])) return row[a];
  }
  // intento case-insensitive / normalizado
  const norm = new Map(Object.keys(row).map((k) => [normalizeLabel(k), k]));
  for (const a of aliases) {
    const hit = norm.get(normalizeLabel(a));
    if (hit && !isNull(row[hit])) return row[hit];
  }
  return null;
}
