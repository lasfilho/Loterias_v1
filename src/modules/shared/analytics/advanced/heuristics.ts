import { type GameRules } from "../../constants";
import { type FrequencyStat } from "../../types";
import type {
  BacktestReport,
  CompositeScore,
  CoverageAnalysis,
  DiversityAnalysis,
  ExplainabilityEntry,
  ExtendedDelayStat,
  MonteCarloResult,
  MultiHorizonTrend,
  ProbabilisticRanking,
} from "../types";
import { type DrawRecord } from "../../repository/base-repository";
import { getAllNumbers } from "../../repository/base-repository";
import { sortDrawsDesc } from "../utils/draw-utils";
import { clamp, mean, normalizeScores } from "../utils/stats-utils";

export function computeCompositeScores(
  frequency: FrequencyStat[],
  delays: ExtendedDelayStat[],
  trends: MultiHorizonTrend[]
): CompositeScore[] {
  const freqNorm = normalizeScores(
    frequency.map((f) => ({ key: f.number, value: f.count }))
  );
  const delayNorm = normalizeScores(
    delays.map((d) => ({ key: d.number, value: d.currentDelay }))
  );
  const trendNorm = new Map(
    trends.map((t) => {
      const boost =
        t.shortTerm.direction === "up"
          ? 0.7
          : t.shortTerm.direction === "down"
            ? 0.3
            : 0.5;
      return [t.number, boost];
    })
  );
  const devNorm = normalizeScores(
    frequency.map((f) => ({
      key: f.number,
      value: Math.abs(f.deviation),
    }))
  );

  const scores: CompositeScore[] = frequency.map((f) => {
    const n = f.number;
    const components = {
      frequency: freqNorm.get(n) ?? 0,
      delay: delayNorm.get(n) ?? 0,
      trend: trendNorm.get(n) ?? 0.5,
      deviation: devNorm.get(n) ?? 0,
    };

    const score =
      components.frequency * 0.35 +
      components.delay * 0.25 +
      components.trend * 0.25 +
      components.deviation * 0.15;

    return { number: n, score, rank: 0, components };
  });

  scores.sort((a, b) => b.score - a.score);
  scores.forEach((s, i) => {
    s.rank = i + 1;
  });

  return scores;
}

export function computeProbabilisticRanking(
  composite: CompositeScore[]
): ProbabilisticRanking[] {
  const total = composite.reduce((s, c) => s + c.score, 0) || 1;

  return composite.map((c) => ({
    number: c.number,
    heuristicWeight: c.score / total,
    rank: c.rank,
    note: "Peso heurístico relativo — não é probabilidade oficial de sorteio",
  }));
}

export function runMonteCarlo(
  rules: GameRules,
  simulations = 5000
): MonteCarloResult {
  const universe = getAllNumbers(rules);
  const pickCount = rules.drawCount;
  const hitBuckets = new Map<number, number>();

  for (let s = 0; s < simulations; s++) {
    const shuffled = [...universe].sort(() => Math.random() - 0.5);
    const simulated = shuffled.slice(0, pickCount);
    const shuffled2 = [...universe].sort(() => Math.random() - 0.5);
    const ticket = shuffled2.slice(0, pickCount);
    const hits = ticket.filter((n) => simulated.includes(n)).length;
    hitBuckets.set(hits, (hitBuckets.get(hits) ?? 0) + 1);
  }

  const hitDistribution = [...hitBuckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hits, count]) => ({
      label: `${hits} acertos`,
      count,
      percentage: (count / simulations) * 100,
    }));

  const meanHits = mean(
    [...hitBuckets.entries()].flatMap(([hits, count]) =>
      Array(count).fill(hits)
    )
  );

  return {
    simulations,
    pickCount,
    meanHits,
    hitDistribution,
    note: "Simulação com sorteio e palpite uniformes independentes",
  };
}

function randomPick(rules: GameRules, exclude?: Set<number>): number[] {
  const pool = getAllNumbers(rules).filter((n) => !exclude?.has(n));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, rules.pickCount).sort((a, b) => a - b);
}

function hits(a: number[], b: number[]): number {
  const set = new Set(b);
  return a.filter((n) => set.has(n)).length;
}

export function runBacktest(
  rules: GameRules,
  draws: DrawRecord[],
  windowContests = 30
): BacktestReport | null {
  const sorted = sortDrawsDesc(draws);
  if (sorted.length < windowContests + 10) return null;

  const testSlice = sorted.slice(0, windowContests);

  const strategies = [
    {
      name: "FREQUENCY_WEIGHTED",
      pick: (train: DrawRecord[]) => {
        const counts = new Map<number, number>();
        getAllNumbers(rules).forEach((n) => counts.set(n, 0));
        train.forEach((d) =>
          d.numbers.forEach((n) => counts.set(n, (counts.get(n) ?? 0) + 1))
        );
        return [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, rules.pickCount)
          .map(([n]) => n)
          .sort((a, b) => a - b);
      },
    },
    {
      name: "DELAY_BALANCED",
      pick: (train: DrawRecord[]) => {
        const delays = getAllNumbers(rules).map((n) => {
          const idx = train.findIndex((d) => d.numbers.includes(n));
          const delay = idx === -1 ? train.length : idx;
          return { n, delay };
        });
        return delays
          .sort((a, b) => b.delay - a.delay)
          .slice(0, rules.pickCount)
          .map((d) => d.n)
          .sort((a, b) => a - b);
      },
    },
  ];

  const runStrategy = (name: string, pickFn: (train: DrawRecord[]) => number[]) => {
    const hitCounts: number[] = [];
    testSlice.forEach((target) => {
      const train = sorted.filter((d) => d.contestNumber < target.contestNumber);
      if (train.length < 20) return;
      const ticket = pickFn(train);
      hitCounts.push(hits(ticket, target.numbers));
    });

    const byLevel: Record<string, number> = {};
    hitCounts.forEach((h) => {
      const key = String(h);
      byLevel[key] = (byLevel[key] ?? 0) + 1;
    });

    return {
      strategy: name,
      contestsTested: hitCounts.length,
      meanHits: mean(hitCounts),
      hitRateByLevel: Object.fromEntries(
        Object.entries(byLevel).map(([k, v]) => [
          k,
          hitCounts.length > 0 ? (v / hitCounts.length) * 100 : 0,
        ])
      ),
    };
  };

  const randomHits: number[] = [];
  testSlice.forEach((target) => {
    const train = sorted.filter((d) => d.contestNumber < target.contestNumber);
    if (train.length < 20) return;
    randomHits.push(hits(randomPick(rules), target.numbers));
  });

  return {
    windowContests,
    strategies: strategies.map((s) => runStrategy(s.name, s.pick)),
    baselineRandom: {
      strategy: "RANDOM",
      contestsTested: randomHits.length,
      meanHits: mean(randomHits),
      hitRateByLevel: {},
    },
    note: "Walk-forward simplificado; não otimiza parâmetros no período de teste",
  };
}

export function computeCoverage(
  rules: GameRules,
  numbers: number[]
): CoverageAnalysis {
  const universe = getAllNumbers(rules);
  const covered = new Set(numbers);
  const uncovered = universe.filter((n) => !covered.has(n));

  return {
    universeSize: universe.length,
    coveredNumbers: covered.size,
    coveragePct: (covered.size / universe.length) * 100,
    uncoveredNumbers: uncovered,
  };
}

export function computeDiversity(
  rules: GameRules,
  numbers: number[]
): DiversityAnalysis {
  const sorted = [...numbers].sort((a, b) => a - b);
  const span = sorted.length > 0 ? sorted[sorted.length - 1] - sorted[0] : 0;
  const maxSpan = rules.maxNumber - rules.minNumber;
  const spread = span / maxSpan;

  let clusterPenalty = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] <= 2) clusterPenalty += 0.1;
  }
  clusterPenalty = clamp(clusterPenalty, 0, 0.5);

  const rangeScore = spread;
  const evenSpread = sorted.length / rules.maxNumber;
  const score = clamp((rangeScore * 0.6 + evenSpread * 0.4) - clusterPenalty, 0, 1);

  return {
    score,
    spread,
    rangeSpan: span,
    concentrationPenalty: clusterPenalty,
    note: "Penaliza dezenas muito próximas; favorece dispersão no volante",
  };
}

export function buildExplainability(
  composite: CompositeScore[],
  topN = 15
): ExplainabilityEntry[] {
  return composite.slice(0, topN).map((c) => {
    const reasons: string[] = [];
    if (c.components.frequency > 0.6) reasons.push("Frequência histórica acima da média");
    if (c.components.delay > 0.6) reasons.push("Atraso atual elevado");
    if (c.components.trend > 0.6) reasons.push("Tendência de curto prazo positiva");
    if (c.components.deviation > 0.6) reasons.push("Desvio em relação à frequência esperada");
    if (reasons.length === 0) reasons.push("Score composto moderado sem destaque único");

    return {
      number: c.number,
      reasons,
      compositeScore: c.score,
    };
  });
}
