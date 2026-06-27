// scripts/make-fixture-snic.ts
// Genera un CSV sintético con la forma de la serie del SNIC: tasa de
// homicidios dolosos (cada 100.000 hab.) por provincia y año. Incluye a
// propósito: el total país (jurisdicción = null, sin warning), una fila con
// provincia no reconocida (→ warning) y un punto sin dato (tasa vacía → aviso).

import * as fs from 'node:fs';
import * as XLSX from 'xlsx';

const DIR = './fixtures/snic';
fs.mkdirSync(DIR, { recursive: true });

const rows: Record<string, unknown>[] = [];
const categoria = 'Homicidios dolosos';

// Serie por provincia, 2021–2023 (subconjunto representativo).
const datos: Array<[string, Record<number, number | null>]> = [
  ['Buenos Aires', { 2021: 4.6, 2022: 4.4, 2023: 4.1 }],
  ['Córdoba', { 2021: 3.8, 2022: 3.5, 2023: 3.3 }],
  ['Santa Fe', { 2021: 8.9, 2022: 8.1, 2023: 7.5 }],
  ['Ciudad Autónoma de Buenos Aires', { 2021: 2.1, 2022: 2.0, 2023: 1.9 }],
  ['Salta', { 2021: 5.2, 2022: 5.0, 2023: null }], // 2023 sin dato → aviso
];

for (const [prov, serie] of datos) {
  for (const [anio, tasa] of Object.entries(serie)) {
    rows.push({ provincia: prov, indice_tiempo: `${anio}-01-01`, categoria, tasa });
  }
}

// Total país (jurisdicción → null, NO debe generar warning).
for (const [anio, tasa] of Object.entries({ 2021: 5.0, 2022: 4.7, 2023: 4.5 })) {
  rows.push({ provincia: 'Total país', indice_tiempo: `${anio}-01-01`, categoria, tasa });
}

// Provincia no reconocida (→ warning de jurisdicción sin mapear).
rows.push({
  provincia: 'Provincia Inexistente',
  indice_tiempo: '2022-01-01',
  categoria,
  tasa: 9.9,
});

const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'serie');
const buf = XLSX.write(wb, { type: 'buffer', bookType: 'csv' });
fs.writeFileSync(`${DIR}/snic_homicidios_dolosos.csv`, buf);

console.log(`Fixture escrito en ${DIR}/`);
