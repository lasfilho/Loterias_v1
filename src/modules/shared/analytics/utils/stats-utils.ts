import type { HistogramBucket } from "../types";

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function toHistogram(
  values: number[],
  buckets: Array<{ label: string; min: number; max: number }>
): HistogramBucket[] {
  const total = values.length;
  return buckets.map((b) => {
    const count = values.filter((v) => v >= b.min && v <= b.max).length;
    return {
      label: b.label,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    };
  });
}

export function percentileSlice<T>(
  sorted: T[],
  fraction: number
): T[] {
  const n = Math.max(1, Math.ceil(sorted.length * fraction));
  return sorted.slice(0, n);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeScores(
  items: Array<{ key: number; value: number }>
): Map<number, number> {
  const max = Math.max(...items.map((i) => i.value), 1);
  const min = Math.min(...items.map((i) => i.value), 0);
  const range = max - min || 1;
  return new Map(
    items.map((i) => [i.key, (i.value - min) / range])
  );
}
