import { type GameRules } from "../../constants";
import { type ParityDistribution, type RangeDistribution } from "../../types";
import { type DrawRecord } from "../../repository/base-repository";
import type {
  ConsecutiveRepetitionStat,
  SumStatistics,
} from "../types";
import {
  countRepeatsWithPrevious,
  drawSums,
} from "../utils/draw-utils";
import { mean, median, stdDev, toHistogram } from "../utils/stats-utils";

export function computeParity(draws: DrawRecord[]): ParityDistribution {
  let even = 0;
  let odd = 0;

  draws.forEach((draw) => {
    draw.numbers.forEach((n) => {
      if (n % 2 === 0) even++;
      else odd++;
    });
  });

  const total = even + odd;
  return {
    even,
    odd,
    evenPercentage: total > 0 ? (even / total) * 100 : 0,
    oddPercentage: total > 0 ? (odd / total) * 100 : 0,
  };
}

export function computeRanges(
  rules: GameRules,
  draws: DrawRecord[],
  rangeCount = 5
): RangeDistribution[] {
  const span = rules.maxNumber - rules.minNumber + 1;
  const rangeSize = Math.ceil(span / rangeCount);
  const ranges: RangeDistribution[] = [];

  for (let i = 0; i < rangeCount; i++) {
    const start = rules.minNumber + i * rangeSize;
    const end = Math.min(start + rangeSize - 1, rules.maxNumber);
    ranges.push({
      range: `${String(start).padStart(2, "0")}-${String(end).padStart(2, "0")}`,
      count: 0,
      percentage: 0,
    });
  }

  let total = 0;
  draws.forEach((draw) => {
    draw.numbers.forEach((n) => {
      const idx = Math.min(
        Math.floor((n - rules.minNumber) / rangeSize),
        rangeCount - 1
      );
      ranges[idx].count++;
      total++;
    });
  });

  ranges.forEach((r) => {
    r.percentage = total > 0 ? (r.count / total) * 100 : 0;
  });

  return ranges;
}

export function computeSumStatistics(draws: DrawRecord[]): SumStatistics {
  const values = drawSums(draws);
  return {
    mean: mean(values),
    median: median(values),
    stdDev: stdDev(values),
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
    values,
  };
}

export function computeConsecutiveRepetition(
  draws: DrawRecord[]
): ConsecutiveRepetitionStat {
  const perDraw = countRepeatsWithPrevious(draws);
  const repeatCounts = perDraw.map((p) => p.repeatCount);

  const distribution = toHistogram(repeatCounts, [
    { label: "0", min: 0, max: 0 },
    { label: "1", min: 1, max: 1 },
    { label: "2", min: 2, max: 2 },
    { label: "3", min: 3, max: 3 },
    { label: "4+", min: 4, max: 99 },
  ]);

  return {
    averageRepeats: mean(repeatCounts),
    maxRepeats: repeatCounts.length ? Math.max(...repeatCounts) : 0,
    distribution,
    perDraw: perDraw.slice(0, 50),
  };
}
