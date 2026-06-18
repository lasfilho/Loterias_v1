import type { GameSlug } from "../constants";
import {
  BACKTEST_HIT_BANDS,
  BACKTEST_PARTIAL_THRESHOLD,
  type BacktestContestPoint,
  type BacktestStrategyReport,
  type PartialStreakStats,
  type PeriodAggregate,
} from "./types";
import { mean, median, stdDev } from "../analytics/utils/stats-utils";

export function countHits(predicted: number[], actual: number[]): number {
  const set = new Set(actual);
  return predicted.filter((n) => set.has(n)).length;
}

export function hitRateByLevel(
  hitCounts: number[],
  pickCount: number
): Record<string, number> {
  const byLevel: Record<string, number> = {};
  hitCounts.forEach((h) => {
    const key = String(h);
    byLevel[key] = (byLevel[key] ?? 0) + 1;
  });

  const total = hitCounts.length || 1;
  const rates: Record<string, number> = {};
  for (let i = 0; i <= pickCount; i++) {
    const key = String(i);
    rates[key] = ((byLevel[key] ?? 0) / total) * 100;
  }
  return rates;
}

export function computeHitBandRates(
  slug: GameSlug,
  hitCounts: number[]
): Array<{ label: string; rate: number; count: number }> {
  const bands = BACKTEST_HIT_BANDS[slug];
  const total = hitCounts.length || 1;

  return bands.map((band) => {
    const count = hitCounts.filter(
      (h) => h >= band.min && h <= band.max
    ).length;
    return {
      label: band.label,
      rate: (count / total) * 100,
      count,
    };
  });
}

export function computePartialStreakStats(
  hitCounts: number[],
  threshold: number
): PartialStreakStats {
  const partialFlags = hitCounts.map((h) => h >= threshold);
  const partialHitCount = partialFlags.filter(Boolean).length;

  const streakLengths: number[] = [];
  let current = 0;
  partialFlags.forEach((isPartial) => {
    if (isPartial) {
      current++;
    } else if (current > 0) {
      streakLengths.push(current);
      current = 0;
    }
  });
  if (current > 0) streakLengths.push(current);

  const distribution = new Map<number, number>();
  streakLengths.forEach((len) => {
    distribution.set(len, (distribution.get(len) ?? 0) + 1);
  });

  return {
    maxStreak: streakLengths.length > 0 ? Math.max(...streakLengths) : 0,
    meanStreak: streakLengths.length > 0 ? mean(streakLengths) : 0,
    streakDistribution: [...distribution.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([length, count]) => ({ length, count })),
    partialHitCount,
    partialHitRate:
      hitCounts.length > 0 ? (partialHitCount / hitCounts.length) * 100 : 0,
  };
}

export function pearsonCorrelation(
  xs: number[],
  ys: number[]
): number | null {
  if (xs.length < 3 || xs.length !== ys.length) return null;

  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return null;
  return num / den;
}

export function computePeriodAggregates(
  points: BacktestContestPoint[],
  chunkSize = 10
): PeriodAggregate[] {
  if (points.length === 0) return [];

  const sorted = [...points].sort(
    (a, b) => a.contestNumber - b.contestNumber
  );
  const aggregates: PeriodAggregate[] = [];

  for (let i = 0; i < sorted.length; i += chunkSize) {
    const chunk = sorted.slice(i, i + chunkSize);
    aggregates.push({
      periodLabel: `C${chunk[0].contestNumber}–C${chunk[chunk.length - 1].contestNumber}`,
      fromContest: chunk[0].contestNumber,
      toContest: chunk[chunk.length - 1].contestNumber,
      contests: chunk.length,
      meanHits: mean(chunk.map((p) => p.hits)),
    });
  }

  return aggregates;
}

export function buildStrategyReport(
  slug: GameSlug,
  strategy: string,
  strategyDetail: BacktestStrategyReport["strategyDetail"],
  points: BacktestContestPoint[],
  pickCount: number
): BacktestStrategyReport {
  const hitCounts = points.map((p) => p.hits);
  const threshold = BACKTEST_PARTIAL_THRESHOLD[slug];
  const scores = points.map((p) => p.predictedScore);
  const hits = points.map((p) => p.hits);

  return {
    strategy,
    strategyDetail,
    rank: 0,
    contestsTested: points.length,
    meanHits: hitCounts.length > 0 ? mean(hitCounts) : 0,
    medianHits: hitCounts.length > 0 ? median(hitCounts) : 0,
    stdDevHits: hitCounts.length > 1 ? stdDev(hitCounts) : 0,
    maxHits: hitCounts.length > 0 ? Math.max(...hitCounts) : 0,
    minHits: hitCounts.length > 0 ? Math.min(...hitCounts) : 0,
    hitRateByLevel: hitRateByLevel(hitCounts, pickCount),
    hitBandRates: computeHitBandRates(slug, hitCounts),
    partialHitRate: computePartialStreakStats(hitCounts, threshold)
      .partialHitRate,
    partialHitThreshold: threshold,
    partialStreakStats: computePartialStreakStats(hitCounts, threshold),
    scoreCorrelation: pearsonCorrelation(scores, hits),
    meanPredictedScore: scores.length > 0 ? mean(scores) : 0,
    periodAggregates: computePeriodAggregates(points),
    contestPoints: points,
  };
}

export function rankStrategies(
  reports: BacktestStrategyReport[]
): BacktestStrategyReport[] {
  const sorted = [...reports].sort((a, b) => {
    if (b.meanHits !== a.meanHits) return b.meanHits - a.meanHits;
    const corrA = a.scoreCorrelation ?? -2;
    const corrB = b.scoreCorrelation ?? -2;
    return corrB - corrA;
  });

  return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function randomTicket(
  minNumber: number,
  maxNumber: number,
  pickCount: number,
  seed: number
): number[] {
  const pool = Array.from(
    { length: maxNumber - minNumber + 1 },
    (_, i) => i + minNumber
  );
  let s = seed;
  const rng = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled.slice(0, pickCount).sort((a, b) => a - b);
}
