import type { DrawFilter } from "../types";

export const ANALYTICS_ENGINE_VERSION = "2.0.0";

export const ANALYTICS_DISCLAIMER =
  "Indicadores derivados de dados históricos e simulações heurísticas. Não representam probabilidade oficial nem garantia de acerto.";

export const ANALYTICS_LIMITATIONS = [
  "Sorteios oficiais são modelados como eventos aleatórios; padrões passados não preveem resultados futuros.",
  "Scores e rankings são heurísticos — úteis para estudo, não para promessa de ganho.",
  "Janelas móveis curtas amplificam ruído amostral.",
  "Correlação entre dezenas não implica causalidade.",
  "Monte Carlo usa distribuição uniforme simplificada.",
  "Backtest retrospectivo pode sofrer overfitting se usado para ajustar estratégias no mesmo período.",
];

// ─── Re-export legacy types (compat dashboards) ───────────────

export type {
  FrequencyStat,
  DelayStat,
  PairStat,
  TrendStat,
  ParityDistribution,
  RangeDistribution,
  DrawFilter,
} from "../types";

// ─── Extended types ───────────────────────────────────────────

export interface AnalyticsMeta {
  engineVersion: string;
  computedAt: string;
  gameSlug: string;
  totalDraws: number;
  lastContest: number | null;
  lastDrawDate: Date | null;
  filterApplied: DrawFilter;
  disclaimer: string;
  limitations: string[];
}

export interface HistogramBucket {
  label: string;
  count: number;
  percentage: number;
}

export interface SumStatistics {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  values: number[];
}

export interface ConsecutiveRepetitionStat {
  averageRepeats: number;
  maxRepeats: number;
  distribution: HistogramBucket[];
  perDraw: Array<{ contestNumber: number; repeatCount: number }>;
}

export interface ExtendedDelayStat {
  number: number;
  currentDelay: number;
  maxHistoricalDelay: number;
  lastContest: number | null;
  avgDelay: number;
  appearances: number;
}

export interface MovingWindowStat {
  windowSize: number;
  frequencies: Array<{ number: number; count: number; percentage: number }>;
  hotNumbers: number[];
  coldNumbers: number[];
}

export interface MultiHorizonTrend {
  number: number;
  shortTerm: TrendHorizon;
  mediumTerm: TrendHorizon;
  longTerm: TrendHorizon;
}

export interface TrendHorizon {
  windowSize: number;
  recentRate: number;
  historicalRate: number;
  direction: "up" | "down" | "stable";
}

export interface TripleStat {
  triple: [number, number, number];
  count: number;
  percentage: number;
}

export interface CooccurrenceStat {
  numberA: number;
  numberB: number;
  cooccurrenceCount: number;
  expectedCount: number;
  lift: number;
}

export interface GapDistribution {
  gap: number;
  count: number;
  percentage: number;
}

export interface SequencePatternStat {
  type: "consecutive_run";
  length: number;
  occurrences: number;
  percentage: number;
}

export interface FrameCoreStat {
  frame: { count: number; percentage: number };
  core: { count: number; percentage: number };
  definition: string;
}

export interface LineColumnStat {
  line: number;
  column: number;
  count: number;
  percentage: number;
}

export interface CycleStat {
  number: number;
  avgCycleLength: number;
  cycleStability: "stable" | "variable" | "irregular";
}

export interface CompositeScore {
  number: number;
  score: number;
  rank: number;
  components: {
    frequency: number;
    delay: number;
    trend: number;
    deviation: number;
  };
}

export interface ProbabilisticRanking {
  number: number;
  heuristicWeight: number;
  rank: number;
  note: string;
}

export interface MonteCarloResult {
  simulations: number;
  pickCount: number;
  meanHits: number;
  hitDistribution: HistogramBucket[];
  note: string;
}

export interface BacktestStrategyResult {
  strategy: string;
  contestsTested: number;
  meanHits: number;
  hitRateByLevel: Record<string, number>;
}

export interface BacktestReport {
  windowContests: number;
  strategies: BacktestStrategyResult[];
  baselineRandom: BacktestStrategyResult;
  note: string;
}

export interface CoverageAnalysis {
  universeSize: number;
  coveredNumbers: number;
  coveragePct: number;
  uncoveredNumbers: number[];
}

export interface DiversityAnalysis {
  score: number;
  spread: number;
  rangeSpan: number;
  concentrationPenalty: number;
  note: string;
}

export interface ExplainabilityEntry {
  number: number;
  reasons: string[];
  compositeScore: number;
}

export interface BasicAnalytics {
  frequency: import("../types").FrequencyStat[];
  delays: ExtendedDelayStat[];
  parity: import("../types").ParityDistribution;
  ranges: import("../types").RangeDistribution[];
  sumStatistics: SumStatistics;
  consecutiveRepetition: ConsecutiveRepetitionStat;
  occurrenceHistogram: HistogramBucket[];
  hotNumbers: number[];
  coldNumbers: number[];
}

export interface IntermediateAnalytics {
  movingWindows: MovingWindowStat[];
  multiHorizonTrends: MultiHorizonTrend[];
  cycles: CycleStat[];
  frameCore: FrameCoreStat | null;
  topPairs: import("../types").PairStat[];
  topTriples: TripleStat[];
  cooccurrences: CooccurrenceStat[];
  gapDistribution: GapDistribution[];
  sequencePatterns: SequencePatternStat[];
  lineColumn?: LineColumnStat[];
}

export interface AdvancedAnalytics {
  compositeScores: CompositeScore[];
  probabilisticRanking: ProbabilisticRanking[];
  monteCarlo: MonteCarloResult;
  backtest: BacktestReport | null;
  coverage: CoverageAnalysis;
  diversity: DiversityAnalysis;
  explainability: ExplainabilityEntry[];
}

export interface GameSpecificAnalytics {
  slug: string;
  data: Record<string, unknown>;
}

/** Relatório completo consumível por dashboards e API */
export interface FullAnalyticsReport {
  meta: AnalyticsMeta;
  basic: BasicAnalytics;
  intermediate: IntermediateAnalytics;
  advanced: AdvancedAnalytics;
  gameSpecific: GameSpecificAnalytics;
  /** Campos legados no topo para compatibilidade */
  totalDraws: number;
  lastContest: number | null;
  lastDrawDate: Date | null;
  frequency: import("../types").FrequencyStat[];
  delays: import("../types").DelayStat[];
  topPairs: import("../types").PairStat[];
  trends: import("../types").TrendStat[];
  parity: import("../types").ParityDistribution;
  ranges: import("../types").RangeDistribution[];
  hotNumbers: number[];
  coldNumbers: number[];
}

export interface GameAnalyticsExtension {
  slug: string;
  compute(
    draws: import("../repository/base-repository").DrawRecord[],
    rules: import("../constants").GameRules
  ): Record<string, unknown>;
  getFrameCore?(
    draws: import("../repository/base-repository").DrawRecord[],
    rules: import("../constants").GameRules
  ): FrameCoreStat;
  getLineColumn?(
    draws: import("../repository/base-repository").DrawRecord[],
    rules: import("../constants").GameRules
  ): LineColumnStat[] | undefined;
}
