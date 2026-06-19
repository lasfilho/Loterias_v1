import type { GameSlug } from "../constants";
import {
  BACKTEST_HIT_BANDS,
  BACKTEST_PARTIAL_THRESHOLD,
} from "../backtest/types";

export function getPrizeBand(slug: GameSlug, hits: number): string | null {
  const bands = BACKTEST_HIT_BANDS[slug];
  const match = bands.find((b) => hits >= b.min && hits <= b.max);
  return match?.label ?? null;
}

export function isPrizeEligible(slug: GameSlug, hits: number): boolean {
  return hits >= BACKTEST_PARTIAL_THRESHOLD[slug];
}

export function getPrizeBandDescription(
  slug: GameSlug,
  hits: number
): string | null {
  const bands = BACKTEST_HIT_BANDS[slug];
  const match = bands.find((b) => hits >= b.min && hits <= b.max);
  return match?.description ?? match?.label ?? null;
}
