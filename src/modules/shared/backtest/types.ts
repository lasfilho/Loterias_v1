import type { GameSlug } from "../constants";
import type { GenerationMode, GenerationStrategy } from "../prediction/types";

export const BACKTEST_ENGINE_VERSION = "1.0.0";

export const BACKTEST_DISCLAIMER =
  "Backtest retrospectivo mede aderência histórica das heurísticas — não comprova capacidade preditiva em sorteios futuros. Sorteios oficiais são eventos aleatórios.";

export const BACKTEST_LIMITATIONS = [
  "Walk-forward usa apenas dados anteriores a cada concurso, mas ainda há risco de overfitting ao comparar muitas estratégias.",
  "Scores previstos são heurísticos; correlação com acertos não implica causalidade.",
  "Resultados passados não alteram probabilidades oficiais dos próximos sorteios.",
  "Estratégias com mais parâmetros podem parecer melhores por acaso em janelas curtas.",
];

export interface HitBand {
  label: string;
  min: number;
  max: number;
  description?: string;
}

export const BACKTEST_HIT_BANDS: Record<GameSlug, HitBand[]> = {
  lotofacil: [
    { label: "0–10", min: 0, max: 10, description: "Sem premiação" },
    { label: "11", min: 11, max: 11, description: "Faixa 11 acertos" },
    { label: "12", min: 12, max: 12 },
    { label: "13", min: 13, max: 13 },
    { label: "14", min: 14, max: 14 },
    { label: "15", min: 15, max: 15, description: "Cartela cheia" },
  ],
  megasena: [
    { label: "0–3", min: 0, max: 3 },
    { label: "Quadra", min: 4, max: 4 },
    { label: "Quina", min: 5, max: 5 },
    { label: "Sena", min: 6, max: 6 },
  ],
  quina: [
    { label: "0–1", min: 0, max: 1 },
    { label: "Duque", min: 2, max: 2 },
    { label: "Terno", min: 3, max: 3 },
    { label: "Quadra", min: 4, max: 4 },
    { label: "Quina", min: 5, max: 5 },
  ],
};

export const BACKTEST_PARTIAL_THRESHOLD: Record<GameSlug, number> = {
  lotofacil: 11,
  megasena: 4,
  quina: 3,
};

export interface BacktestRequest {
  fromContest?: number;
  toContest?: number;
  windowSize?: number;
  trainMinDraws?: number;
  mode?: GenerationMode;
  strategies?: GenerationStrategy[];
  includeRandomBaseline?: boolean;
  persist?: boolean;
  persistDetails?: boolean;
  triggeredBy?: string;
}

export interface BacktestContestPoint {
  contestNumber: number;
  predictedNumbers: number[];
  actualNumbers: number[];
  hits: number;
  predictedScore: number;
}

export interface PartialStreakStats {
  maxStreak: number;
  meanStreak: number;
  streakDistribution: Array<{ length: number; count: number }>;
  partialHitCount: number;
  partialHitRate: number;
}

export interface PeriodAggregate {
  periodLabel: string;
  fromContest: number;
  toContest: number;
  contests: number;
  meanHits: number;
}

export interface BacktestStrategyReport {
  strategy: string;
  strategyDetail: GenerationStrategy | "RANDOM";
  rank: number;
  contestsTested: number;
  meanHits: number;
  medianHits: number;
  stdDevHits: number;
  maxHits: number;
  minHits: number;
  hitRateByLevel: Record<string, number>;
  hitBandRates: Array<{ label: string; rate: number; count: number }>;
  partialHitRate: number;
  partialHitThreshold: number;
  partialStreakStats: PartialStreakStats;
  scoreCorrelation: number | null;
  meanPredictedScore: number;
  periodAggregates: PeriodAggregate[];
  contestPoints?: BacktestContestPoint[];
}

export interface BacktestReport {
  meta: {
    engineVersion: string;
    gameSlug: GameSlug;
    computedAt: string;
    fromContest: number | null;
    toContest: number | null;
    windowSize: number;
    trainMinDraws: number;
    mode: GenerationMode;
    contestsTested: number;
    disclaimer: string;
    limitations: string[];
  };
  ranking: BacktestStrategyReport[];
  baselineRandom?: BacktestStrategyReport;
}

export const DEFAULT_BACKTEST_STRATEGIES: GenerationStrategy[] = [
  "FREQUENCY_WEIGHTED",
  "DELAY_BALANCED",
  "COMPOSITE_SCORE",
  "HOT_COLD_MIX",
  "PATTERN_AWARE",
  "HYBRID",
];
