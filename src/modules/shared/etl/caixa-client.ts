/**
 * @deprecated Use CaixaApiAdapter from ./adapters/caixa-api.adapter
 * Mantido para compatibilidade com imports existentes.
 */
import { type GameRules } from "../constants";
import { type CaixaDrawResponse, type NormalizedDraw } from "../types";
import {
  CaixaApiAdapter,
  createCaixaAdapter,
} from "./adapters/caixa-api.adapter";
import { mapCaixaDrawToNormalized } from "./mappers/caixa-draw.mapper";

export { CaixaApiAdapter as CaixaApiClient, createCaixaAdapter as createCaixaClient };

export type { CaixaDrawResponse, NormalizedDraw };

/** @deprecated Use mapCaixaDrawToNormalized */
export function normalizeCaixaDraw(
  rules: GameRules,
  data: CaixaDrawResponse
): NormalizedDraw {
  const result = mapCaixaDrawToNormalized(rules, data);
  if (!result.success || !result.draw) {
    throw new Error(result.errors.join("; "));
  }
  return result.draw;
}
