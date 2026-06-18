import { type GameRules } from "../../constants";
import { type FrequencyStat } from "../../types";
import { type DrawRecord } from "../../repository/base-repository";
import { getAllNumbers } from "../../repository/base-repository";
import { percentileSlice } from "../utils/stats-utils";

export function computeFrequency(
  rules: GameRules,
  draws: DrawRecord[]
): FrequencyStat[] {
  const universe = getAllNumbers(rules);
  const expected =
    draws.length > 0
      ? (draws.length * rules.drawCount) / universe.length
      : 0;

  const counts = new Map<number, number>();
  universe.forEach((n) => counts.set(n, 0));

  draws.forEach((draw) => {
    draw.numbers.forEach((n) => counts.set(n, (counts.get(n) ?? 0) + 1));
  });

  const total = draws.length * rules.drawCount;

  return universe.map((number) => {
    const count = counts.get(number) ?? 0;
    return {
      number,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      expected,
      deviation: count - expected,
    };
  });
}

export function computeHotCold(
  frequency: FrequencyStat[],
  fraction = 0.2
): { hot: number[]; cold: number[] } {
  const sorted = [...frequency].sort((a, b) => b.count - a.count);
  const n = Math.max(1, Math.ceil(sorted.length * fraction));
  return {
    hot: percentileSlice(sorted, fraction).map((f) => f.number),
    cold: sorted.slice(-n).map((f) => f.number),
  };
}

export function computeOccurrenceHistogram(
  frequency: FrequencyStat[]
): Array<{ label: string; count: number; percentage: number }> {
  const counts = frequency.map((f) => f.count);
  if (counts.length === 0) return [];

  const max = Math.max(...counts);
  const bucketSize = Math.max(1, Math.ceil((max + 1) / 5));
  const buckets: Array<{ label: string; count: number; percentage: number }> = [];

  for (let start = 0; start <= max; start += bucketSize) {
    const end = start + bucketSize - 1;
    const inBucket = counts.filter((c) => c >= start && c <= end).length;
    buckets.push({
      label: `${start}-${end}`,
      count: inBucket,
      percentage: (inBucket / counts.length) * 100,
    });
  }

  return buckets;
}
