import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";

export type SpreadsheetRow = Record<string, unknown>;

export function readCaixaSpreadsheet(filePath: string): SpreadsheetRow[] {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Arquivo não encontrado: ${resolved}`);
  }

  const workbook = XLSX.readFile(resolved, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error(`Planilha vazia: ${resolved}`);
  }

  const sheet = workbook.Sheets[sheetName];
  expandSheetRange(sheet);

  const rows = XLSX.utils.sheet_to_json<SpreadsheetRow>(sheet, {
    defval: null,
  });

  if (rows.length === 0) {
    throw new Error(`Nenhuma linha de dados em: ${resolved}`);
  }

  return rows;
}

/** Corrige planilhas Caixa com metadado !ref truncado (só cabeçalho). */
function expandSheetRange(sheet: XLSX.WorkSheet): void {
  let minRow = Infinity;
  let minCol = Infinity;
  let maxRow = 0;
  let maxCol = 0;

  for (const key of Object.keys(sheet)) {
    if (key.startsWith("!")) continue;
    const cell = XLSX.utils.decode_cell(key);
    if (cell.r < minRow) minRow = cell.r;
    if (cell.c < minCol) minCol = cell.c;
    if (cell.r > maxRow) maxRow = cell.r;
    if (cell.c > maxCol) maxCol = cell.c;
  }

  if (minRow !== Infinity) {
    sheet["!ref"] = XLSX.utils.encode_range({
      s: { r: minRow, c: minCol },
      e: { r: maxRow, c: maxCol },
    });
  }
}

export function findColumnKey(
  row: SpreadsheetRow,
  matcher: RegExp
): string | undefined {
  return Object.keys(row).find((key) => matcher.test(normalizeKey(key)));
}

export function normalizeKey(key: string): string {
  return key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getCell(row: SpreadsheetRow, matcher: RegExp): unknown {
  const key = findColumnKey(row, matcher);
  return key ? row[key] : undefined;
}

export function getBallColumns(row: SpreadsheetRow): string[] {
  return Object.keys(row)
    .filter((key) => /^bola\d+$/i.test(normalizeKey(key)))
    .sort((a, b) => {
      const na = parseInt(normalizeKey(a).replace("bola", ""), 10);
      const nb = parseInt(normalizeKey(b).replace("bola", ""), 10);
      return na - nb;
    });
}
