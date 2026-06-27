// scripts/make-fixture.ts
// Genera 3 .xlsx sintéticos con la forma del RNFJA (causa / víctima / sujeto)
// para probar el adaptador de punta a punta SIN los archivos reales (que son
// binarios y de acceso restringido). Incluye a propósito: una causa con 2
// víctimas, una con 2 sujetos, una víctima trans, un caso "vinculado" y un
// valor de lugar inventado para disparar un warning de mapeo.

import * as fs from 'node:fs';
import * as XLSX from 'xlsx';

const DIR = './fixtures/rnfja-2024';
fs.mkdirSync(DIR, { recursive: true });

function write(name: string, rows: Record<string, unknown>[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'datos');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(`${DIR}/${name}`, buf);
}

// --- Base CAUSA (1 fila por causa) ---
write('base_causa_2024.xlsx', [
  {
    id_causa: 'C001',
    jurisdiccion: 'Buenos Aires',
    localidad: 'La Matanza',
    fecha_hecho: '2024-03-12',
    lugar_hecho: 'Vivienda de la víctima',
    medio: 'Arma blanca',
    tipo_femicidio: 'Femicidio directo',
    violencia_sexual: 'No',
    estado_causa: 'Etapa de juicio',
  },
  {
    id_causa: 'C002',
    jurisdiccion: 'Córdoba',
    localidad: 'Capital',
    fecha_hecho: '12/05/2024',
    lugar_hecho: 'Vivienda compartida',
    medio: 'Arma de fuego',
    tipo_femicidio: 'Femicidio directo',
    violencia_sexual: 'No',
    estado_causa: 'Sentencia firme',
  },
  {
    id_causa: 'C003',
    jurisdiccion: 'Santa Fe',
    localidad: 'Rosario',
    fecha_hecho: '2024-07-01',
    lugar_hecho: 'Plaza del barrio', // valor raro -> warning
    medio: 'Fuerza física',
    tipo_femicidio: 'Femicidio vinculado',
    violencia_sexual: 'Sí',
    estado_causa: 'Etapa de investigación',
  },
  {
    id_causa: 'C004',
    jurisdiccion: 'Salta',
    localidad: 'Capital',
    fecha_hecho: '2024-09-20',
    lugar_hecho: 'Vivienda del sujeto activo',
    medio: 'Asfixia',
    tipo_femicidio: 'Femicidio directo',
    violencia_sexual: 'No',
    estado_causa: 'Etapa de investigación',
  },
]);

// --- Base VÍCTIMA (1+ por causa; C001 tiene 2) ---
write('base_victima_2024.xlsx', [
  {
    id_causa: 'C001',
    edad: 34,
    identidad_genero: 'Mujer cis',
    nacionalidad: 'Argentina',
    embarazo: 'No',
    hijos_a_cargo: 2,
  },
  {
    id_causa: 'C001',
    edad: 8,
    identidad_genero: 'Mujer cis',
    nacionalidad: 'Argentina',
    embarazo: 'No',
    hijos_a_cargo: 0,
  },
  {
    id_causa: 'C002',
    edad: 27,
    identidad_genero: 'Mujer cis',
    nacionalidad: 'Argentina',
    embarazo: 'No',
    hijos_a_cargo: 1,
  },
  {
    id_causa: 'C003',
    edad: 41,
    identidad_genero: 'Mujer trans/travesti',
    nacionalidad: 'Argentina',
    embarazo: 'No',
    hijos_a_cargo: 0,
  },
  {
    id_causa: 'C004',
    edad: 19,
    identidad_genero: 'Mujer cis',
    nacionalidad: 'Boliviana',
    embarazo: 'Sí',
    hijos_a_cargo: 0,
  },
]);

// --- Base SUJETO ACTIVO (1+ por causa; C004 tiene 2) ---
write('base_sujeto_activo_2024.xlsx', [
  {
    id_causa: 'C001',
    edad: 38,
    vinculo: 'Pareja',
    suicidio_posterior: 'No',
    estado_procesal: 'Etapa de juicio',
  },
  {
    id_causa: 'C002',
    edad: 45,
    vinculo: 'Expareja',
    suicidio_posterior: 'Sí',
    estado_procesal: 'Sentencia firme',
  },
  {
    id_causa: 'C003',
    edad: 52,
    vinculo: 'Vecino',
    suicidio_posterior: 'No',
    estado_procesal: 'Etapa de investigación',
  },
  {
    id_causa: 'C004',
    edad: 60,
    vinculo: 'Padrastro',
    suicidio_posterior: 'No',
    estado_procesal: 'Etapa de investigación',
  },
  {
    id_causa: 'C004',
    edad: 23,
    vinculo: 'Conocido',
    suicidio_posterior: 'No',
    estado_procesal: 'Etapa de investigación',
  },
]);

console.log(`Fixture escrito en ${DIR}/`);
