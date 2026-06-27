// reconcile/cluster.ts
// Etapa de reconciliación (caso_unificado). Corre DESPUÉS de cargar varias
// fuentes. Agrupa afirmaciones co-referentes (mismo hecho real) SIN fusionarlas
// ni promediarlas: cada caso_reportado sigue intacto y contable por su fuente.
//
// v0: heurística determinística por (fecha_hecho + jurisdiccion + franja etaria).
// El verdadero valor (ver §6 del estándar) es detectar qué hecho ve una fuente
// que otra pierde -> por eso marcamos los clusters multi-fuente.

import type { CasoReportadoCompleto } from '../schema.js';

export interface ClaimRef {
  fuente_id: string;
  id_externo: string;
}
export interface CasoUnificado {
  id: string;
  clave: string;
  fecha_hecho: string | null;
  jurisdiccion: string | null;
  miembros: ClaimRef[];
  fuentes: string[];
  multifuente: boolean;
}

function bucketEdad(e: number | null): string {
  if (e == null) return 'sd';
  return `${Math.floor(e / 10) * 10}s`;
}

function clave(c: CasoReportadoCompleto): string {
  const f = c.caso_reportado.fecha_hecho ?? 'sd';
  const j = (c.caso_reportado.jurisdiccion ?? 'sd').toLowerCase().trim();
  return `${f}|${j}|${bucketEdad(c.victima.edad)}`;
}

export function reconciliar(casos: CasoReportadoCompleto[]): CasoUnificado[] {
  const grupos = new Map<string, CasoReportadoCompleto[]>();
  for (const c of casos) {
    const k = clave(c);
    (grupos.get(k) ?? grupos.set(k, []).get(k)!).push(c);
  }

  let n = 0;
  return [...grupos.entries()].map(([k, miembros]) => {
    const fuentes = [...new Set(miembros.map((m) => m.caso_reportado.fuente_id))];
    return {
      id: `U${String(++n).padStart(5, '0')}`,
      clave: k,
      fecha_hecho: miembros[0].caso_reportado.fecha_hecho,
      jurisdiccion: miembros[0].caso_reportado.jurisdiccion,
      miembros: miembros.map((m) => ({
        fuente_id: m.caso_reportado.fuente_id,
        id_externo: m.caso_reportado.id_externo,
      })),
      fuentes,
      multifuente: fuentes.length > 1,
    };
  });
}
