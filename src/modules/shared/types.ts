export interface CaixaDrawResponse {
  numero: number;
  dataApuracao: string;
  listaDezenas: string[];
  acumulado: boolean;
  valorArrecadado?: number;
  valorEstimadoProximoConcurso?: number;
  listaRateioPremio?: Array<{
    faixa: number;
    numeroDeGanhadores: number;
    valorPremio: number;
  }>;
}

export interface NormalizedDraw {
  contestNumber: number;
  drawDate: Date;
  numbers: number[];
  accumulated: boolean;
  prizePool?: number;
  winnersCount?: number;
  nextEstimate?: number;
}

export interface FrequencyStat {
  number: number;
  count: number;
  percentage: number;
  expected: number;
  deviation: number;
}

export interface DelayStat {
  number: number;
  delay: number;
  lastContest: number | null;
  avgDelay: number;
}

export interface PairStat {
  pair: [number, number];
  count: number;
  percentage: number;
}

export interface TrendStat {
  number: number;
  recentCount: number;
  historicalAvg: number;
  trend: "up" | "down" | "stable";
}

export interface ParityDistribution {
  even: number;
  odd: number;
  evenPercentage: number;
  oddPercentage: number;
}

export interface RangeDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSummary {
  totalDraws: number;
  lastContest: number | null;
  lastDrawDate: Date | null;
  frequency: FrequencyStat[];
  delays: DelayStat[];
  topPairs: PairStat[];
  trends: TrendStat[];
  parity: ParityDistribution;
  ranges: RangeDistribution[];
  hotNumbers: number[];
  coldNumbers: number[];
}

export type { FullAnalyticsReport } from "./analytics/types";

export interface PredictionResult {
  numbers: number[];
  strategy: string;
  confidence: number;
  metadata: Record<string, unknown>;
  hash?: string;
  gameSlug?: string;
  strategyDetail?: string;
  mode?: string;
  parameters?: Record<string, unknown>;
  score?: number;
  explanation?: string;
  explanationDetails?: Array<{
    number: number;
    reasons: string[];
    compositeScore: number;
  }>;
  timestamp?: string;
  id?: string;
}

export interface DrawFilter {
  fromContest?: number;
  toContest?: number;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}
