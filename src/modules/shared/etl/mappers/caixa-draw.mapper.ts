import { type GameRules } from "../../constants";
import { type CaixaDrawResponse, type NormalizedDraw } from "../../types";
import { parseBrazilianDate } from "@/lib/utils";
import { type TransformResult } from "../types";

export function mapCaixaDrawToNormalized(
  rules: GameRules,
  raw: CaixaDrawResponse,
  expectedContest?: number
): TransformResult {
  const errors: string[] = [];

  const contestNumber = raw.numero ?? expectedContest;
  if (!contestNumber || contestNumber < 1) {
    errors.push("Número do concurso inválido ou ausente");
    return { success: false, errors };
  }

  if (expectedContest && raw.numero && raw.numero !== expectedContest) {
    errors.push(
      `Concurso na resposta (${raw.numero}) difere do solicitado (${expectedContest})`
    );
  }

  if (!raw.listaDezenas?.length) {
    errors.push("listaDezenas ausente ou vazia");
    return { success: false, errors };
  }

  const numbers = raw.listaDezenas
    .map((d) => parseInt(String(d).trim(), 10))
    .filter((n) => !Number.isNaN(n));

  if (numbers.some((n) => !Number.isFinite(n))) {
    errors.push("Dezenas com formato inválido");
  }

  const unique = new Set(numbers);
  if (unique.size !== numbers.length) {
    errors.push("Dezenas duplicadas no payload");
  }

  if (numbers.length !== rules.drawCount) {
    errors.push(
      `Quantidade de dezenas (${numbers.length}) diferente do esperado (${rules.drawCount})`
    );
  }

  if (!raw.dataApuracao) {
    errors.push("dataApuracao ausente");
    return { success: false, errors };
  }

  let drawDate: Date;
  try {
    drawDate = parseBrazilianDate(raw.dataApuracao);
    if (Number.isNaN(drawDate.getTime())) {
      throw new Error("Data inválida");
    }
  } catch {
    errors.push(`dataApuracao inválida: ${raw.dataApuracao}`);
    return { success: false, errors };
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const mainPrize = raw.listaRateioPremio?.find((p) => p.faixa === 1);

  const draw: NormalizedDraw = {
    contestNumber,
    drawDate,
    numbers: sorted,
    accumulated: Boolean(raw.acumulado),
    prizePool: raw.valorArrecadado ?? undefined,
    winnersCount: mainPrize?.numeroDeGanhadores,
    nextEstimate: raw.valorEstimadoProximoConcurso ?? undefined,
  };

  return {
    success: true,
    draw,
    rawPayload: raw,
    errors: [],
  };
}
