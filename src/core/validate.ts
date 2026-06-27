// core/validate.ts
// Validador de conformidad. TODO caso_reportado que sale de CUALQUIER adaptador
// pasa por acá antes de cargarse. Garantiza calidad uniforme aunque el
// adaptador lo haya escrito otra persona. Distingue ERRORES (rompen) de
// AVISOS (señales de calidad de dato que no invalidan).

import type { CasoReportadoCompleto, Publicacion } from '../schema.js';

const ENUMS: Record<string, readonly string[]> = {
  tipologia_unodc: ['intimo_pareja', 'familiar', 'otro', 'no_determinado'],
  identidad: ['mujer_cis', 'mujer_trans_travesti', 'otra', 'no_informada'],
  vinculo: [
    'pareja',
    'expareja',
    'otra_relacion_afectiva',
    'familiar',
    'conocido',
    'desconocido',
    'no_informado',
  ],
  lugar: [
    'vivienda_victima',
    'vivienda_compartida',
    'vivienda_autor',
    'espacio_publico',
    'lugar_trabajo',
    'otro',
    'no_informado',
  ],
  medio: [
    'arma_fuego',
    'arma_blanca',
    'fuerza_fisica',
    'asfixia',
    'fuego',
    'veneno',
    'otro',
    'no_informado',
  ],
  estado_causa: [
    'etapa_investigacion',
    'etapa_juicio',
    'sentencia_no_firme',
    'sentencia_firme',
    'extincion_accion',
    'otros_estados',
    'no_informado',
  ],
};

export interface Issue {
  nivel: 'error' | 'aviso';
  campo: string;
  detalle: string;
  id_externo: string;
}

function inEnum(campo: keyof typeof ENUMS, val: string, id: string, out: Issue[]) {
  if (!ENUMS[campo].includes(val)) {
    out.push({
      nivel: 'error',
      campo,
      detalle: `valor fuera de vocabulario: "${val}"`,
      id_externo: id,
    });
  }
}

function edadOk(edad: number | null, campo: string, id: string, out: Issue[]) {
  if (edad != null && (edad < 0 || edad > 120)) {
    out.push({ nivel: 'error', campo, detalle: `edad implausible: ${edad}`, id_externo: id });
  }
}

export function validateCaso(c: CasoReportadoCompleto, pub?: Publicacion): Issue[] {
  const out: Issue[] = [];
  const id = c.caso_reportado.id_externo;

  inEnum('tipologia_unodc', c.caso_reportado.tipologia_unodc, id, out);
  inEnum('identidad', c.victima.identidad, id, out);
  inEnum('lugar', c.hecho.lugar, id, out);
  inEnum('medio', c.hecho.medio, id, out);
  inEnum('estado_causa', c.respuesta_estatal.estado_causa, id, out);
  c.sujetos_activos.forEach((s) => inEnum('vinculo', s.vinculo, id, out));

  edadOk(c.victima.edad, 'victima.edad', id, out);
  c.sujetos_activos.forEach((s) => edadOk(s.edad, 'sujeto.edad', id, out));

  // fecha del hecho dentro del período de la publicación (si se conoce)
  if (pub && c.caso_reportado.fecha_hecho) {
    const f = c.caso_reportado.fecha_hecho;
    if (f < pub.periodo_inicio || f > pub.periodo_fin) {
      out.push({
        nivel: 'aviso',
        campo: 'fecha_hecho',
        detalle: `fuera del período ${pub.periodo_inicio}..${pub.periodo_fin}: ${f}`,
        id_externo: id,
      });
    }
  }

  // señales de calidad (avisos, no errores)
  if (c.victima.identidad === 'no_informada')
    out.push({
      nivel: 'aviso',
      campo: 'victima.identidad',
      detalle: 'identidad sin informar',
      id_externo: id,
    });
  if (c.sujetos_activos.length === 0)
    out.push({
      nivel: 'aviso',
      campo: 'sujetos_activos',
      detalle: 'caso sin sujeto activo asociado',
      id_externo: id,
    });

  return out;
}

export interface ValidationReport {
  total: number;
  errores: number;
  avisos: number;
  issues: Issue[];
}

export function validateMany(casos: CasoReportadoCompleto[], pub?: Publicacion): ValidationReport {
  const issues = casos.flatMap((c) => validateCaso(c, pub));
  return {
    total: casos.length,
    errores: issues.filter((i) => i.nivel === 'error').length,
    avisos: issues.filter((i) => i.nivel === 'aviso').length,
    issues,
  };
}
