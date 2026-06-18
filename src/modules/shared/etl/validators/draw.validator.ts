import { type GameRules } from "../../constants";
import { type CaixaDrawResponse, type NormalizedDraw } from "../../types";
import { type RawDrawRecord, type ValidationResult } from "../types";

export function validateRawRecord(
  rules: GameRules,
  record: RawDrawRecord
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!record.payload) {
    errors.push("Payload vazio");
    return { valid: false, errors, warnings };
  }

  const raw = record.payload as CaixaDrawResponse;

  if (!raw.numero && !record.contestNumber) {
    errors.push("Número do concurso ausente");
  }

  if (raw.numero && raw.numero !== record.contestNumber) {
    warnings.push(
      `numero no payload (${raw.numero}) difere do contestNumber (${record.contestNumber})`
    );
  }

  if (!Array.isArray(raw.listaDezenas)) {
    errors.push("listaDezenas não é array");
  } else if (raw.listaDezenas.length === 0) {
    errors.push("listaDezenas vazia");
  } else if (raw.listaDezenas.length !== rules.drawCount) {
    errors.push(
      `listaDezenas com ${raw.listaDezenas.length} itens (esperado ${rules.drawCount})`
    );
  }

  if (!raw.dataApuracao) {
    errors.push("dataApuracao ausente");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateNormalizedDraw(
  rules: GameRules,
  draw: NormalizedDraw
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!draw.contestNumber || draw.contestNumber < 1) {
    errors.push("contestNumber inválido");
  }

  if (!draw.drawDate || Number.isNaN(draw.drawDate.getTime())) {
    errors.push("drawDate inválida");
  }

  if (draw.numbers.length !== rules.drawCount) {
    errors.push(
      `numbers.length=${draw.numbers.length}, esperado ${rules.drawCount}`
    );
  }

  const unique = new Set(draw.numbers);
  if (unique.size !== draw.numbers.length) {
    errors.push("Números duplicados");
  }

  for (const n of draw.numbers) {
    if (n < rules.minNumber || n > rules.maxNumber) {
      errors.push(`Número ${n} fora do universo ${rules.minNumber}-${rules.maxNumber}`);
    }
  }

  const sorted = [...draw.numbers].sort((a, b) => a - b);
  if (sorted.some((n, i) => n !== draw.numbers[i])) {
    warnings.push("numbers não estão ordenados (serão normalizados no load)");
  }

  return { valid: errors.length === 0, errors, warnings };
}
