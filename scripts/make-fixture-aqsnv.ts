// scripts/make-fixture-aqsnv.ts
// Genera un .xlsx sintético con el registro de Ahora Que Sí Nos Ven:
// tabla única por víctima. Incluye: femicidio directo, travesticidio,
// instigación al suicidio, caso con perimetral, medio "golpiza" no canónico.

import * as fs from 'node:fs';
import * as XLSX from 'xlsx';

const DIR = './fixtures/aqsnv-2024';
fs.mkdirSync(DIR, { recursive: true });

function write(name: string, rows: Record<string, unknown>[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'datos');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(`${DIR}/${name}`, buf);
}

write('registro_aqsnv_2024.xlsx', [
  {
    id: 1,
    tipo: 'Femicidio',
    fecha: '2024-02-10',
    provincia: 'Buenos Aires',
    localidad: 'Mar del Plata',
    lugar: 'Vivienda de la víctima',
    medio: 'Arma de fuego',
    violencia_sexual: 'No',
    fiscal: 'UFEM Mar del Plata',
    caratula: 'Homicidio agravado por femicidio',
    estado_causa: 'Etapa de investigación',
    edad: 29,
    identidad: 'Mujer cis',
    nacionalidad: 'Argentina',
    embarazo: 'No',
    hijos: 1,
    denuncias_previas: 'Sí',
    vinculo: 'Expareja',
    edad_sujeto: 33,
    perimetral: 'Sí',
  },
  {
    id: 2,
    tipo: 'Femicidio',
    fecha: '2024-04-22',
    provincia: 'Córdoba',
    localidad: 'Villa María',
    lugar: 'Vivienda compartida',
    medio: 'Arma blanca',
    violencia_sexual: 'No',
    fiscal: 'Fiscalía Villa María',
    caratula: 'Homicidio agravado',
    estado_causa: 'Etapa de juicio',
    edad: 35,
    identidad: 'Mujer cis',
    nacionalidad: 'Argentina',
    embarazo: 'Sí',
    hijos: 2,
    denuncias_previas: 'No',
    vinculo: 'Pareja',
    edad_sujeto: 38,
    perimetral: 'No',
  },
  {
    id: 3,
    tipo: 'Travesticidio',
    fecha: '2024-07-05',
    provincia: 'Ciudad de Buenos Aires',
    localidad: 'Palermo',
    lugar: 'Espacio público',
    medio: 'Golpiza',  // fuera de vocabulario canónico → warning
    violencia_sexual: 'Sí',
    fiscal: 'UFEM CABA',
    caratula: 'Homicidio agravado por odio a la identidad de género',
    estado_causa: 'Etapa de investigación',
    edad: 42,
    identidad: 'Mujer trans/travesti',
    nacionalidad: 'Argentina',
    embarazo: 'No',
    hijos: 0,
    denuncias_previas: 'Sí',
    vinculo: 'Desconocido',
    edad_sujeto: null,
    perimetral: 'No',
  },
  {
    id: 4,
    tipo: 'Instigación al suicidio',
    fecha: '2024-09-18',
    provincia: 'Santa Fe',
    localidad: 'Rosario',
    lugar: 'Vivienda de la víctima',
    medio: 'Asfixia',
    violencia_sexual: 'No',
    fiscal: 'Fiscalía Regional Rosario',
    caratula: 'Instigación al suicidio agravada',
    estado_causa: 'Sentencia firme',
    edad: 19,
    identidad: 'Mujer cis',
    nacionalidad: 'Paraguaya',
    embarazo: 'No',
    hijos: 0,
    denuncias_previas: 'Sí',
    vinculo: 'Pareja',
    edad_sujeto: 24,
    perimetral: 'Sí',
  },
  {
    id: 5,
    tipo: 'Femicidio',
    fecha: '2024-11-30',
    provincia: 'Mendoza',
    localidad: 'San Rafael',
    lugar: 'Vivienda del agresor',
    medio: 'Fuerza física',
    violencia_sexual: 'No',
    fiscal: null,
    caratula: null,
    estado_causa: null,
    edad: 56,
    identidad: 'Mujer cis',
    nacionalidad: 'Argentina',
    embarazo: 'No',
    hijos: 4,
    denuncias_previas: 'No',
    vinculo: 'Padrastro',
    edad_sujeto: 61,
    perimetral: 'No',
  },
]);

console.log(`Fixture escrito en ${DIR}/`);