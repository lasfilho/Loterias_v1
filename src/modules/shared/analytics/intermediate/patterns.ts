import { type GameRules } from "../../constants";
import { type PairStat, type TrendStat } from "../../types";
import { type DrawRecord } from "../../repository/base-repository";
import { getAllNumbers } from "../../repository/base-repository";
import type {
  CooccurrenceStat,
  CycleStat,
  FrameCoreStat,
  GapDistribution,
  MovingWindowStat,
  MultiHorizonTrend,
  SequencePatternStat,
  TripleStat,
  TrendHorizon,
} from "../types";
import { sortDrawsDesc } from "../utils/draw-utils";

const WINDOW_SHORT = 10;
const WINDOW_MEDIUM = 30;
const WINDOW_LONG = 50;

export function computeMovingWindows(
  rules: GameRules,
  draws: DrawRecord[],
  sizes = [10, 30, 50]
): MovingWindowStat[] {
  const sorted = sortDrawsDesc(draws);
  const universe = getAllNumbers(rules);

  return sizes
    .filter((w) => sorted.length >= Math.min(w, 3))
    .map((windowSize) => {
      const window = sorted.slice(0, windowSize);
      const counts = new Map<number, number>();
      universe.forEach((n) => counts.set(n, 0));
      window.forEach((d) =>
        d.numbers.forEach((n) => counts.set(n, (counts.get(n) ?? 0) + 1))
      );

      const total = window.length * rules.drawCount;
      const frequencies = universe.map((number) => {
        const count = counts.get(number) ?? 0;
        return {
          number,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
        };
      });

      const sortedFreq = [...frequencies].sort((a, b) => b.count - a.count);
      const hotN = Math.max(1, Math.ceil(universe.length * 0.2));

      return {
        windowSize,
        frequencies,
        hotNumbers: sortedFreq.slice(0, hotN).map((f) => f.number),
        coldNumbers: sortedFreq.slice(-hotN).map((f) => f.number),
      };
    });
}

function horizonTrend(
  draws: DrawRecord[],
  number: number,
  windowSize: number
): TrendHorizon {
  const sorted = sortDrawsDesc(draws);
  const recent = sorted.slice(0, windowSize);
  const recentCount = recent.filter((d) => d.numbers.includes(number)).length;
  const historicalCount = sorted.filter((d) =>
    d.numbers.includes(number)
  ).length;

  const recentRate =
    recent.length > 0 ? recentCount / recent.length : 0;
  const historicalRate =
    sorted.length > 0 ? historicalCount / sorted.length : 0;

  let direction: "up" | "down" | "stable" = "stable";
  if (recentRate > historicalRate * 1.12) direction = "up";
  else if (recentRate < historicalRate * 0.88) direction = "down";

  return {
    windowSize,
    recentRate,
    historicalRate,
    direction,
  };
}

export function computeMultiHorizonTrends(
  rules: GameRules,
  draws: DrawRecord[]
): MultiHorizonTrend[] {
  const universe = getAllNumbers(rules);
  const shortW = Math.min(WINDOW_SHORT, draws.length) || draws.length;
  const mediumW = Math.min(WINDOW_MEDIUM, draws.length) || draws.length;
  const longW = Math.min(WINDOW_LONG, draws.length) || draws.length;

  return universe.map((number) => ({
    number,
    shortTerm: horizonTrend(draws, number, shortW),
    mediumTerm: horizonTrend(draws, number, mediumW),
    longTerm: horizonTrend(draws, number, longW),
  }));
}

export function toLegacyTrends(multi: MultiHorizonTrend[]): TrendStat[] {
  return multi.map((m) => ({
    number: m.number,
    recentCount: Math.round(m.shortTerm.recentRate * m.shortTerm.windowSize),
    historicalAvg: m.longTerm.historicalRate,
    trend: m.shortTerm.direction,
  }));
}

export function computeCycles(
  rules: GameRules,
  draws: DrawRecord[]
): CycleStat[] {
  const universe = getAllNumbers(rules);
  const sorted = sortDrawsDesc(draws);

  return universe.map((number) => {
    const appearances: number[] = [];
    sorted.forEach((d) => {
      if (d.numbers.includes(number)) appearances.push(d.contestNumber);
    });

    if (appearances.length < 2) {
      return {
        number,
        avgCycleLength: 0,
        cycleStability: "irregular" as const,
      };
    }

    const gaps: number[] = [];
    for (let i = 0; i < appearances.length - 1; i++) {
      gaps.push(appearances[i] - appearances[i + 1]);
    }

    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance =
      gaps.reduce((acc, g) => acc + (g - avg) ** 2, 0) / gaps.length;
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 1;

    let cycleStability: CycleStat["cycleStability"] = "stable";
    if (cv > 1) cycleStability = "irregular";
    else if (cv > 0.5) cycleStability = "variable";

    return { number, avgCycleLength: avg, cycleStability };
  });
}

export function computePairs(draws: DrawRecord[], topN = 20): PairStat[] {
  const pairCounts = new Map<string, number>();

  draws.forEach((draw) => {
    const nums = draw.numbers;
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${Math.min(nums[i], nums[j])}-${Math.max(nums[i], nums[j])}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  });

  const pairs: PairStat[] = [];
  pairCounts.forEach((count, key) => {
    const [a, b] = key.split("-").map(Number);
    pairs.push({
      pair: [a, b],
      count,
      percentage: draws.length > 0 ? (count / draws.length) * 100 : 0,
    });
  });

  return pairs.sort((a, b) => b.count - a.count).slice(0, topN);
}

export function computeTriples(draws: DrawRecord[], topN = 15): TripleStat[] {
  const tripleCounts = new Map<string, number>();

  draws.forEach((draw) => {
    const nums = [...draw.numbers].sort((a, b) => a - b);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        for (let k = j + 1; k < nums.length; k++) {
          const key = `${nums[i]}-${nums[j]}-${nums[k]}`;
          tripleCounts.set(key, (tripleCounts.get(key) ?? 0) + 1);
        }
      }
    }
  });

  const triples: TripleStat[] = [];
  tripleCounts.forEach((count, key) => {
    const parts = key.split("-").map(Number) as [number, number, number];
    triples.push({
      triple: parts,
      count,
      percentage: draws.length > 0 ? (count / draws.length) * 100 : 0,
    });
  });

  return triples.sort((a, b) => b.count - a.count).slice(0, topN);
}

export function computeCooccurrences(
  rules: GameRules,
  draws: DrawRecord[],
  topN = 25
): CooccurrenceStat[] {
  if (draws.length === 0) return [];

  const pairCounts = new Map<string, number>();
  const singleCounts = new Map<number, number>();
  const universe = getAllNumbers(rules);
  universe.forEach((n) => singleCounts.set(n, 0));

  draws.forEach((draw) => {
    const nums = draw.numbers;
    nums.forEach((n) => singleCounts.set(n, (singleCounts.get(n) ?? 0) + 1));
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const a = Math.min(nums[i], nums[j]);
        const b = Math.max(nums[i], nums[j]);
        pairCounts.set(`${a}-${b}`, (pairCounts.get(`${a}-${b}`) ?? 0) + 1);
      }
    }
  });

  const n = draws.length;
  const stats: CooccurrenceStat[] = [];

  pairCounts.forEach((coCount, key) => {
    const [a, b] = key.split("-").map(Number);
    const pa = (singleCounts.get(a) ?? 0) / n;
    const pb = (singleCounts.get(b) ?? 0) / n;
    const expected = pa * pb * n;
    const lift = expected > 0 ? coCount / expected : 0;
    stats.push({
      numberA: a,
      numberB: b,
      cooccurrenceCount: coCount,
      expectedCount: expected,
      lift,
    });
  });

  return stats.sort((a, b) => b.lift - a.lift).slice(0, topN);
}

export function computeGapDistribution(draws: DrawRecord[]): GapDistribution[] {
  const gapCounts = new Map<number, number>();
  let total = 0;

  draws.forEach((draw) => {
    const sorted = [...draw.numbers].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i] - sorted[i - 1];
      gapCounts.set(gap, (gapCounts.get(gap) ?? 0) + 1);
      total++;
    }
  });

  return [...gapCounts.entries()]
    .map(([gap, count]) => ({
      gap,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => a.gap - b.gap);
}

export function computeSequencePatterns(
  draws: DrawRecord[]
): SequencePatternStat[] {
  const runLengths = new Map<number, number>();
  let totalDraws = 0;

  draws.forEach((draw) => {
    const sorted = [...draw.numbers].sort((a, b) => a - b);
    let run = 1;
    let maxRun = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) {
        run++;
        maxRun = Math.max(maxRun, run);
      } else {
        run = 1;
      }
    }
    runLengths.set(maxRun, (runLengths.get(maxRun) ?? 0) + 1);
    totalDraws++;
  });

  return [...runLengths.entries()]
    .map(([length, occurrences]) => ({
      type: "consecutive_run" as const,
      length,
      occurrences,
      percentage: totalDraws > 0 ? (occurrences / totalDraws) * 100 : 0,
    }))
    .sort((a, b) => a.length - b.length);
}

export function computeLinearFrameCore(
  rules: GameRules,
  draws: DrawRecord[],
  frameWidth = 2
): FrameCoreStat {
  const frameNumbers = new Set<number>();
  for (let n = rules.minNumber; n <= rules.minNumber + frameWidth - 1; n++) {
    frameNumbers.add(n);
  }
  for (let n = rules.maxNumber - frameWidth + 1; n <= rules.maxNumber; n++) {
    frameNumbers.add(n);
  }

  let frameCount = 0;
  let coreCount = 0;

  draws.forEach((draw) => {
    draw.numbers.forEach((n) => {
      if (frameNumbers.has(n)) frameCount++;
      else coreCount++;
    });
  });

  const total = frameCount + coreCount;
  return {
    frame: {
      count: frameCount,
      percentage: total > 0 ? (frameCount / total) * 100 : 0,
    },
    core: {
      count: coreCount,
      percentage: total > 0 ? (coreCount / total) * 100 : 0,
    },
    definition: `Moldura: ${frameWidth} dezenas em cada extremo do universo ${rules.minNumber}-${rules.maxNumber}`,
  };
}
