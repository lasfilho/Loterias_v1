import { type GameSlug } from "../constants";
import type { GameAnalyticsExtension } from "./types";
import { lotofacilAnalyticsExtension } from "../../lotofacil/analytics.extension";
import { megasenaAnalyticsExtension } from "../../megasena/analytics.extension";
import { quinaAnalyticsExtension } from "../../quina/analytics.extension";

const extensions: Record<GameSlug, GameAnalyticsExtension> = {
  lotofacil: lotofacilAnalyticsExtension,
  megasena: megasenaAnalyticsExtension,
  quina: quinaAnalyticsExtension,
};

export function getGameAnalyticsExtension(
  slug: GameSlug
): GameAnalyticsExtension {
  return extensions[slug];
}
