// scripts/make-fixture-lucia-perez.ts
// Genera un .xlsx sintético con el padrón del Observatorio Lucía Pérez:
// una sola tabla por víctima con todos los campos en línea.
// Incluye a propósito: una víctima trans/travesti, un caso con denuncias
// previas, un caso con hijos a cargo, un medio "picana eléctrica" inventado
// para disparar warning de mapeo.

import * as fs from 'node:fs';
import * as XLSX from 'xlsx';

const DIR = './fixtures/lucia-perez-2024';
fs.mkdirSync(DIR, { recursive: true });

function write(name: string, rows: Record<string, unknown>[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'datos');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(`${DIR}/${name}`, buf);
}

write('padron_lucia_perez_2024.xlsx', [
  {
    id: 1,
    tipo: 'Femicidio directo',
    fecha: '2024-01-15',
    provincia: 'Buenos Aires',
    localidad: 'La Plata',
    lugar: 'Vivienda de la víctima',
    medio: 'Arma de fuego',
    violencia_sexual: 'No',
    fiscal: 'UFEM N°1 La Plata',
    caratula: 'Homicidio agravado por el vínculo (art. 80 inc. 1 CP)',
    estado_causa: 'Etapa de juicio',
    edad: 31,
    identidad: 'Mujer cis',
    nacionalidad: 'Argentina',
    embarazo: 'No',
    hijos: 2,
    denuncias_previas: 'Sí',
    vinculo: 'Expareja',
    edad_sujeto: 35,
    medida_proteccion: 'Sí',
  },
  {
    id: 2,
    tipo: 'Femicidio directo',
    fecha: '2024-03-08',
    provincia: 'Córdoba',
    localidad: 'Capital',
    lugar: 'Vivienda compartida',
    medio: 'Arma blanca',
    violencia_sexual: 'No',
    fiscal: 'Fiscalía de Violencia de Género Córdoba',
    caratula: 'Homicidio doblemente agravado (femicidio, art. 80 inc. 11 CP)',
    estado_causa: 'Sentencia firme',
    edad: 27,
    identidad: 'Mujer cis',
    nacionalidad: 'Argentina',
    embarazo: 'Sí',
    hijos: 0,
    denuncias_previas: 'No',
    vinculo: 'Pareja',
    edad_sujeto: 30,
    medida_proteccion: 'No',
  },
  {
    id: 3,
    tipo: 'Travesticidio',
    fecha: '2024-06-20',
    provincia: 'Santa Fe',
    localidad: 'Rosario',
    lugar: 'Espacio público',
    medio: 'Picana eléctrica', // valor inventado → warning
    violencia_sexual: 'Sí',
    fiscal: 'Fiscalía Regional Rosario',
    caratula: null,
    estado_causa: 'Etapa de investigación',
    edad: 38,
    identidad: 'Mujer trans/travesti',
    nacionalidad: 'Argentina',
    embarazo: 'No',
    hijos: 0,
    denuncias_previas: 'Sí',
    vinculo: 'Desconocido',
    edad_sujeto: null,
    medida_proteccion: 'No',
  },
  {
    id: 4,
    tipo: 'Femicidio vinculado',
    fecha: '2024-09-12',
    provincia: 'Salta',
    localidad: 'Orán',
    lugar: 'Vivienda de la víctima',
    medio: 'Asfixia',
    violencia_sexual: 'No',
    fiscal: 'UFEM Salta',
    caratula: 'Homicidio agravado',
    estado_causa: 'Etapa de investigación',
    edad: 45,
    identidad: 'Mujer cis',
    nacionalidad: 'Boliviana',
    embarazo: 'No',
    hijos: 3,
    denuncias_previas: 'No',
    vinculo: 'Padrastro',
    edad_sujeto: 62,
    medida_proteccion: 'No',
  },
]);

console.log(`Fixture escrito en ${DIR}/`);