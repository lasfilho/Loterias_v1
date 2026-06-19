import type { GameRules } from "../constants";
import type { FullAnalyticsReport } from "../analytics/types";
import { getAllNumbers } from "../repository/base-repository";
import type { GenerationFilter, GenerationStrategy, StrategyWeights } from "./types";
import { filterCandidatePool } from "./heuristics";
import {
  computeSpecialNumberWeight,
  resolveSpecialNumbersTargets,
} from "./special-numbers-heuristics";

export interface StrategyContext {
  rules: GameRules;
  report: FullAnalyticsReport;
  weights: StrategyWeights;
  pickCount: number;
  exclude: Set<number>;
  include: number[];
  pool: number[];
  rng: () => number;
}

export function weightedSample(
  weights: { number: number; weight: number }[],
  count: number,
  include: number[],
  rng: () => number
): number[] {
  const selected = new Set<number>(include);
  const pool = weights.filter((w) => !selected.has(w.number) && w.weight > 0);

  while (selected.size < count && pool.length > 0) {
    const totalWeight = pool.reduce((s, w) => s + w.weight, 0);
    let random = rng() * totalWeight;

    for (let i = 0; i < pool.length; i++) {
      random -= pool[i].weight;
      if (random <= 0) {
        selected.add(pool[i].number);
        pool.splice(i, 1);
        break;
      }
    }
  }

  return Array.from(selected).sort((a, b) => a - b);
}

export function finalizeSelection(
  rules: GameRules,
  numbers: number[],
  count: number,
  exclude: Set<number>,
  include: number[],
  pool: number[],
  rng: () => number
): number[] {
  const selected = new Set<number>(include);
  numbers.forEach((n) => {
    if (!exclude.has(n)) selected.add(n);
  });

  const candidates = pool.length > 0 ? pool : getAllNumbers(rules).filter((n) => !exclude.has(n));
  while (selected.size < count) {
    const remaining = candidates.filter((n) => !selected.has(n));
    if (remaining.length === 0) break;
    selected.add(remaining[Math.floor(rng() * remaining.length)]);
  }

  return Array.from(selected).sort((a, b) => a - b).slice(0, count);
}

export function runFrequencyStrategy(ctx: StrategyContext): number[] {
  const weights = ctx.report.frequency
    .filter((f) => ctx.pool.includes(f.number))
    .map((f) => ({ number: f.number, weight: f.count + 1 }));
  return weightedSample(weights, ctx.pickCount, ctx.include, ctx.rng);
}

export function runDelayStrategy(ctx: StrategyContext): number[] {
  const weights = ctx.report.basic.delays
    .filter((d) => ctx.pool.includes(d.number))
    .map((d) => ({
      number: d.number,
      weight: d.currentDelay + d.avgDelay + 1,
    }));
  return weightedSample(weights, ctx.pickCount, ctx.include, ctx.rng);
}

export function runCompositeStrategy(ctx: StrategyContext): number[] {
  const top = ctx.report.advanced.compositeScores
    .filter((c) => ctx.pool.includes(c.number))
    .sort((a, b) => b.score - a.score)
    .slice(0, ctx.pickCount * 2);

  const weights = top.map((c) => ({
    number: c.number,
    weight: c.score + 0.01,
  }));
  return weightedSample(weights, ctx.pickCount, ctx.include, ctx.rng);
}

export function runHotColdStrategy(ctx: StrategyContext): number[] {
  const hotCount = Math.ceil(ctx.pickCount * 0.4);
  const coldCount = Math.ceil(ctx.pickCount * 0.3);
  const neutralCount = ctx.pickCount - hotCount - coldCount;

  const hot = ctx.report.hotNumbers.filter((n) => ctx.pool.includes(n));
  const cold = ctx.report.coldNumbers.filter((n) => ctx.pool.includes(n));
  const neutral = ctx.pool.filter((n) => !hot.includes(n) && !cold.includes(n));

  const selected = new Set<number>(ctx.include);
  const pickRandom = (candidates: number[], n: number) => {
    const shuffled = [...candidates].sort(() => ctx.rng() - 0.5);
    for (const num of shuffled) {
      if (selected.size >= ctx.pickCount) break;
      if ([...selected].filter((x) => candidates.includes(x)).length >= n) break;
      selected.add(num);
    }
  };

  pickRandom(hot, hotCount);
  pickRandom(cold, coldCount);
  pickRandom(neutral, neutralCount);

  return Array.from(selected).sort((a, b) => a - b);
}

export function runPatternStrategy(ctx: StrategyContext): number[] {
  const targetEven = Math.round(
    (ctx.report.parity.evenPercentage / 100) * ctx.pickCount
  );
  const selected = new Set<number>(ctx.include);

  const evenCandidates = ctx.report.frequency
    .filter((f) => f.number % 2 === 0 && ctx.pool.includes(f.number))
    .sort((a, b) => b.count - a.count);
  const oddCandidates = ctx.report.frequency
    .filter((f) => f.number % 2 === 1 && ctx.pool.includes(f.number))
    .sort((a, b) => b.count - a.count);

  let evenAdded = [...selected].filter((n) => n % 2 === 0).length;
  for (const f of evenCandidates) {
    if (selected.size >= ctx.pickCount) break;
    if (evenAdded >= targetEven) break;
    selected.add(f.number);
    evenAdded++;
  }
  for (const f of oddCandidates) {
    if (selected.size >= ctx.pickCount) break;
    selected.add(f.number);
  }

  const rangeTarget = ctx.report.ranges.map((r) =>
    Math.round((r.percentage / 100) * ctx.pickCount)
  );
  const rangeCounts = new Array(ctx.report.ranges.length).fill(0);
  const span = ctx.rules.maxNumber - ctx.rules.minNumber + 1;
  const rangeSize = Math.ceil(span / ctx.report.ranges.length);

  for (const f of ctx.report.frequency.sort((a, b) => b.count - a.count)) {
    if (selected.size >= ctx.pickCount) break;
    if (!ctx.pool.includes(f.number) || selected.has(f.number)) continue;
    const idx = Math.min(
      Math.floor((f.number - ctx.rules.minNumber) / rangeSize),
      ctx.report.ranges.length - 1
    );
    if (rangeCounts[idx] < (rangeTarget[idx] || 1) + 1) {
      selected.add(f.number);
      rangeCounts[idx]++;
    }
  }

  for (const f of ctx.report.frequency) {
    if (selected.size >= ctx.pickCount) break;
    if (ctx.pool.includes(f.number)) selected.add(f.number);
  }

  return nudgeSpecialNumberCounts(
    Array.from(selected).sort((a, b) => a - b).slice(0, ctx.pickCount),
    ctx
  );
}

function nudgeSpecialNumberCounts(
  numbers: number[],
  ctx: StrategyContext
): number[] {
  const targets = resolveSpecialNumbersTargets(ctx.report);
  const selected = new Set(numbers);

  const adjustCategory = (set: Set<number>, target: number) => {
    let count = [...selected].filter((n) => set.has(n)).length;
    const poolSorted = ctx.pool
      .filter((n) => !selected.has(n))
      .map((n) => ({
        n,
        w: computeSpecialNumberWeight(n, ctx.report),
      }))
      .sort((a, b) => b.w - a.w);

    while (count < target) {
      const add = poolSorted.find((p) => set.has(p.n));
      if (!add) break;

      if (selected.size < ctx.pickCount) {
        selected.add(add.n);
        count++;
        continue;
      }

      const toRemove = [...selected]
        .filter((n) => !set.has(n))
        .sort(
          (a, b) =>
            computeSpecialNumberWeight(a, ctx.report) -
            computeSpecialNumberWeight(b, ctx.report)
        )[0];
      if (!toRemove) break;
      selected.delete(toRemove);
      selected.add(add.n);
      count++;
    }

    while (count > target && selected.size > 0) {
      const removable = [...selected]
        .filter((n) => set.has(n))
        .sort(
          (a, b) =>
            computeSpecialNumberWeight(a, ctx.report) -
            computeSpecialNumberWeight(b, ctx.report)
        );
      if (removable.length === 0) break;
      selected.delete(removable[0]);
      count--;
    }
  };

  adjustCategory(targets.primeSet, targets.targetPrimeCount);
  adjustCategory(targets.fibonacciSet, targets.targetFibonacciCount);

  return finalizeSelection(
    ctx.rules,
    Array.from(selected),
    ctx.pickCount,
    ctx.exclude,
    ctx.include,
    ctx.pool,
    ctx.rng
  );
}

export function runHybridStrategy(ctx: StrategyContext): number[] {
  const scores = new Map<number, number>();

  ctx.report.frequency.forEach((f) => {
    if (!ctx.pool.includes(f.number)) return;
    const delay = ctx.report.basic.delays.find((d) => d.number === f.number);
    const composite = ctx.report.advanced.compositeScores.find(
      (c) => c.number === f.number
    );
    const trend = ctx.report.intermediate.multiHorizonTrends.find(
      (t) => t.number === f.number
    );

    const freqScore = f.count / (ctx.report.totalDraws || 1);
    const delayScore = (delay?.currentDelay ?? 0) / (ctx.report.lastContest || 1);
    const compositeScore = composite?.score ?? 0;
    const trendScore =
      trend?.shortTerm.direction === "up"
        ? 1.2
        : trend?.shortTerm.direction === "down"
          ? 0.8
          : 1;
    const specialScore = computeSpecialNumberWeight(f.number, ctx.report);

    const w = ctx.weights;
    scores.set(
      f.number,
      freqScore * w.frequency +
        delayScore * w.delay +
        compositeScore * w.composite +
        trendScore * w.hotCold * 0.5 +
        (f.number % 2 === 0
          ? ctx.report.parity.evenPercentage / 100
          : ctx.report.parity.oddPercentage / 100) *
          w.pattern *
          0.3 +
        specialScore * w.primeFibonacci
    );
  });

  const weights = Array.from(scores.entries()).map(([number, weight]) => ({
    number,
    weight: weight + 0.01,
  }));

  const picked = weightedSample(weights, ctx.pickCount, ctx.include, ctx.rng);

  return nudgeSpecialNumberCounts(picked, ctx);
}

export function executeStrategy(
  strategy: GenerationStrategy,
  ctx: StrategyContext
): number[] {
  switch (strategy) {
    case "FREQUENCY_WEIGHTED":
      return runFrequencyStrategy(ctx);
    case "DELAY_BALANCED":
      return runDelayStrategy(ctx);
    case "COMPOSITE_SCORE":
      return runCompositeStrategy(ctx);
    case "HOT_COLD_MIX":
      return runHotColdStrategy(ctx);
    case "PATTERN_AWARE":
      return runPatternStrategy(ctx);
    case "HYBRID":
    default:
      return runHybridStrategy(ctx);
  }
}

export function buildStrategyContext(
  rules: GameRules,
  report: FullAnalyticsReport,
  weights: StrategyWeights,
  pickCount: number,
  exclude: Set<number>,
  include: number[],
  rng: () => number,
  filter?: GenerationFilter
): StrategyContext {
  return {
    rules,
    report,
    weights,
    pickCount,
    exclude,
    include,
    pool: filterCandidatePool(rules, report, exclude, filter),
    rng,
  };
}
