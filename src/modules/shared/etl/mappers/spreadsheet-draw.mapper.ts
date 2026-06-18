import { type GameRules, type GameSlug } from "../../constants";
import { type NormalizedDraw } from "../../types";
import { parseBrazilianDate } from "@/lib/utils";
import {
  getBallColumns,
  getCell,
  type SpreadsheetRow,
} from "../parsers/caixa-spreadsheet.parser";
import { type TransformResult } from "../types";

const MAIN_TIER_WINNERS: Record<GameSlug, RegExp> = {
  lotofacil: /ganhadores\s*15\s*acertos/i,
  megasena: /ganhadores\s*6\s*acertos/i,
  quina: /ganhadores\s*5\s*acertos/i,
};

export function mapSpreadsheetRowToNormalized(
  rules: GameRules,
  row: SpreadsheetRow
): TransformResult {
  const errors: string[] = [];

  const contestRaw = getCell(row, /^concurso$/i);
  const contestNumber = parseInt(String(contestRaw ?? "").trim(), 10);
  if (!contestNumber || contestNumber < 1) {
    errors.push("Concurso inválido ou ausente");
    return { success: false, errors };
  }

  const dateRaw = getCell(row, /data.*sorteio/i);
  const drawDate = parseSpreadsheetDate(dateRaw);
  if (!drawDate || Number.isNaN(drawDate.getTime())) {
    errors.push(`Data do sorteio inválida: ${String(dateRaw ?? "")}`);
    return { success: false, errors };
  }

  const ballKeys = getBallColumns(row);
  const numbers = ballKeys
    .map((key) => parseInt(String(row[key] ?? "").trim(), 10))
    .filter((n) => !Number.isNaN(n));

  if (numbers.length !== rules.drawCount) {
    errors.push(
      `Quantidade de bolas (${numbers.length}) diferente do esperado (${rules.drawCount})`
    );
  }

  const unique = new Set(numbers);
  if (unique.size !== numbers.length) {
    errors.push("Dezenas duplicadas na linha");
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const winnersCount = parseOptionalInt(
    getCell(row, MAIN_TIER_WINNERS[rules.slug])
  );
  const prizePool = parseBrazilianCurrency(
    getCell(row, /arrecad/i)
  );
  const nextEstimate = parseBrazilianCurrency(
    getCell(row, /estimativa/i)
  );

  const draw: NormalizedDraw = {
    contestNumber,
    drawDate,
    numbers: sorted,
    accumulated:
      winnersCount !== undefined ? winnersCount === 0 : false,
    prizePool,
    winnersCount,
    nextEstimate,
  };

  return {
    success: true,
    draw,
    rawPayload: row,
    errors: [],
  };
}

function parseSpreadsheetDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value;

  const text = String(value).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    return parseBrazilianDate(text);
  }

  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 30000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    epoch.setUTCDate(epoch.getUTCDate() + asNumber);
    return epoch;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseOptionalInt(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  const text = String(value).trim();
  if (!text) return undefined;
  const n = parseInt(text.replace(/[^\d-]/g, ""), 10);
  return Number.isNaN(n) ? undefined : n;
}

function parseBrazilianCurrency(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;

  const text = String(value)
    .replace(/R\$\s?/gi, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  const n = parseFloat(text);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
