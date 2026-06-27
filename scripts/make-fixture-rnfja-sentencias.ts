// scripts/make-fixture-rnfja-sentencias.ts
// Genera un .xlsx sintético con la forma del Observatorio de Seguimiento de
// Causas y Sentencias de Femicidio (OM-CSJN): tabla única, 1 fila por causa
// con su desenlace judicial. Incluye a propósito: condena firme, absolución
// (sentencia firme pero hubo_condena=false), causa aún en juicio, una víctima
// trans/travesti y un resultado fuera de vocabulario para disparar un warning.

import * as fs from 'node:fs';
import * as XLSX from 'xlsx';

const DIR = './fixtures/rnfja-sentencias-2024';
fs.mkdirSync(DIR, { recursive: true });

function write(name: string, rows: Record<string, unknown>[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'datos');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(`${DIR}/${name}`, buf);
}

write('seguimiento_sentencias_2024.xlsx', [
  {
    id_causa: 'S001',
    caratula: 'Homicidio agravado por femicidio (art. 80 inc. 11)',
    fecha_hecho: '2021-05-14',
    provincia: 'Buenos Aires',
    localidad: 'Quilmes',
    estado_causa: 'Sentencia firme',
    resultado: 'Condena',
    pena: 'Prisión perpetua',
    fecha_sentencia: '2024-03-10',
    edad: 31,
    identidad: 'Mujer cis',
    vinculo: 'Expareja',
    edad_sujeto: 36,
  },
  {
    id_causa: 'S002',
    caratula: 'Homicidio agravado por el vínculo y femicidio',
    fecha_hecho: '2020-11-02',
    provincia: 'Santa Fe',
    localidad: 'Rosario',
    estado_causa: 'Sentencia firme',
    resultado: 'Absolución', // sentencia firme PERO sin condena
    pena: null,
    fecha_sentencia: '2024-06-21',
    edad: 24,
    identidad: 'Mujer cis',
    vinculo: 'Pareja',
    edad_sujeto: 29,
  },
  {
    id_causa: 'S003',
    caratula: 'Homicidio agravado por odio a la identidad de género',
    fecha_hecho: '2022-02-18',
    provincia: 'Ciudad de Buenos Aires',
    localidad: 'Flores',
    estado_causa: 'Etapa de juicio',
    resultado: 'Sin sentencia',
    pena: null,
    fecha_sentencia: null,
    edad: 39,
    identidad: 'Mujer trans/travesti',
    vinculo: 'Desconocido',
    edad_sujeto: null,
  },
  {
    id_causa: 'S004',
    caratula: 'Homicidio agravado por femicidio',
    fecha_hecho: '2019-08-30',
    provincia: 'Mendoza',
    localidad: 'Godoy Cruz',
    estado_causa: 'Sentencia no firme',
    resultado: 'Condena',
    pena: '18 años de prisión',
    fecha_sentencia: '2024-09-05',
    edad: 45,
    identidad: 'Mujer cis',
    vinculo: 'Familiar',
    edad_sujeto: 52,
  },
  {
    id_causa: 'S005',
    caratula: 'Homicidio agravado por femicidio',
    fecha_hecho: '2023-01-09',
    provincia: 'Córdoba',
    localidad: 'Río Cuarto',
    estado_causa: 'Etapa de investigación',
    resultado: 'pendiente_de_elevacion', // fuera de vocabulario → warning
    pena: null,
    fecha_sentencia: null,
    edad: 28,
    identidad: 'Mujer cis',
    vinculo: 'Pareja',
    edad_sujeto: 31,
  },
]);

console.log(`Fixture escrito en ${DIR}/`);
