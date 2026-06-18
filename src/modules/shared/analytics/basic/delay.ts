import { type GameRules } from "../../constants";
import { type DelayStat } from "../../types";
import { type DrawRecord } from "../../repository/base-repository";
import { getAllNumbers } from "../../repository/base-repository";
import { sortDrawsDesc } from "../utils/draw-utils";
import type { ExtendedDelayStat } from "../types";

export function computeExtendedDelays(
  rules: GameRules,
  draws: DrawRecord[]
): ExtendedDelayStat[] {
  const universe = getAllNumbers(rules);
  const sorted = sortDrawsDesc(draws);
  const latestContest = sorted[0]?.contestNumber ?? 0;

  return universe.map((number) => {
    let currentDelay = latestContest;
    let maxHistoricalDelay = 0;
    let lastContest: number | null = null;
    const appearances: number[] = [];

    for (const draw of sorted) {
      if (draw.numbers.includes(number)) {
        if (lastContest === null) {
          currentDelay = latestContest - draw.contestNumber;
          lastContest = draw.contestNumber;
        }
        appearances.push(draw.contestNumber);
      }
    }

    if (appearances.length === 0) {
      currentDelay = sorted.length > 0 ? latestContest - (sorted[sorted.length - 1]?.contestNumber ?? 0) + 1 : 0;
    }

    if (appearances.length > 1) {
      const gaps: number[] = [];
      for (let i = 0; i < appearances.length - 1; i++) {
        gaps.push(appearances[i] - appearances[i + 1] - 1);
      }
      maxHistoricalDelay = Math.max(...gaps, currentDelay);
    } else {
      maxHistoricalDelay = currentDelay;
    }

    let avgDelay = currentDelay;
    if (appearances.length > 1) {
      const gaps: number[] = [];
      for (let i = 0; i < appearances.length - 1; i++) {
        gaps.push(appearances[i] - appearances[i + 1]);
      }
      avgDelay = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    }

    return {
      number,
      currentDelay,
      maxHistoricalDelay,
      lastContest,
      avgDelay,
      appearances: appearances.length,
    };
  });
}

export function toLegacyDelayStats(extended: ExtendedDelayStat[]): DelayStat[] {
  return extended.map((d) => ({
    number: d.number,
    delay: d.currentDelay,
    lastContest: d.lastContest,
    avgDelay: d.avgDelay,
  }));
}
