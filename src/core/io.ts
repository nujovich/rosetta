// core/io.ts
// Lectura de planillas (.xls/.xlsx/.csv) -> filas crudas. Compartido por
// todos los adaptadores que leen archivos tabulares.

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as XLSX from 'xlsx';
import type { RawRow } from './harmonize.js';

export function readSheet(file: string): RawRow[] {
  const buf = fs.readFileSync(file);
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<RawRow>(sheet, { raw: false, defval: null });
}

export function findFile(dir: string, rx: RegExp): string | null {
  const hit = fs
    .readdirSync(dir)
    .filter((f) => /\.(xls|xlsx|csv)$/i.test(f))
    .find((f) => rx.test(f));
  return hit ? path.join(dir, hit) : null;
}
