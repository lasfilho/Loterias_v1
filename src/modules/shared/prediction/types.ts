import { PredictionStrategy } from "@prisma/client";
import type { GameSlug } from "../constants";
import type { DrawFilter } from "../types";
import type { ExplainabilityEntry } from "../analytics/types";

export type GenerationMode = "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";

/** Estratégias internas (COMPOSITE_SCORE persiste como HYBRID + metadata) */
export type GenerationStrategy =
  | "FREQUENCY_WEIGHTED"
  | "DELAY_BALANCED"
  | "COMPOSITE_SCORE"
  | "HOT_COLD_MIX"
  | "PATTERN_AWARE"
  | "HYBRID";

export interface StrategyWeights {
  frequency: number;
  delay: number;
  composite: number;
  hotCold: number;
  pattern: number;
  primeFibonacci: number;
}

export interface GenerationFilter extends DrawFilter {
  minDelay?: number;
  maxDelay?: number;
  hotOnly?: boolean;
  coldOnly?: boolean;
}

export interface GenerationRequest {
  strategy?: GenerationStrategy;
  mode?: GenerationMode;
  count?: number;
  batchSize?: number;
  excludeNumbers?: number[];
  includeNumbers?: number[];
  filter?: GenerationFilter;
  weights?: Partial<StrategyWeights>;
  seed?: number;
  minDiversity?: number;
  persist?: boolean;
  notes?: string;
  analysisRunId?: string;
  configId?: string;
}

export interface GeneratedPrediction {
  hash: string;
  gameSlug: GameSlug;
  numbers: number[];
  strategy: PredictionStrategy;
  strategyDetail: GenerationStrategy;
  mode: GenerationMode;
  parameters: Record<string, unknown>;
  score: number;
  confidence: number;
  explanation: string;
  explanationDetails: ExplainabilityEntry[];
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface StrategyComparisonItem {
  strategy: GenerationStrategy;
  prediction: GeneratedPrediction;
}

export interface BatchGenerationResult {
  predictions: GeneratedPrediction[];
  diversityScore: number;
}

export interface GenerationResult {
  prediction?: GeneratedPrediction;
  batch?: BatchGenerationResult;
  comparison?: StrategyComparisonItem[];
  savedId?: string;
}

export function toPrismaStrategy(
  strategy: GenerationStrategy
): PredictionStrategy {
  if (strategy === "COMPOSITE_SCORE") return PredictionStrategy.HYBRID;
  return strategy as PredictionStrategy;
}

export const GENERATION_STRATEGIES: {
  value: GenerationStrategy;
  prisma: PredictionStrategy;
  label: string;
  description: string;
}[] = [
  {
    value: "FREQUENCY_WEIGHTED",
    prisma: PredictionStrategy.FREQUENCY_WEIGHTED,
    label: "Frequência histórica",
    description: "Prioriza dezenas com maior frequência na amostra",
  },
  {
    value: "DELAY_BALANCED",
    prisma: PredictionStrategy.DELAY_BALANCED,
    label: "Atraso balanceado",
    description: "Pondera dezenas com maior atraso atual",
  },
  {
    value: "COMPOSITE_SCORE",
    prisma: PredictionStrategy.HYBRID,
    label: "Score composto",
    description: "Usa ranking do motor analítico v2",
  },
  {
    value: "HOT_COLD_MIX",
    prisma: PredictionStrategy.HOT_COLD_MIX,
    label: "Quentes + frias",
    description: "Mistura dezenas quentes e frias",
  },
  {
    value: "PATTERN_AWARE",
    prisma: PredictionStrategy.PATTERN_AWARE,
    label: "Padrões (par/ímpar e faixas)",
    description: "Respeita paridade, faixas e equilíbrio por quadrantes (Mega/Quina)",
  },
  {
    value: "HYBRID",
    prisma: PredictionStrategy.HYBRID,
    label: "Híbrido",
    description:
      "Combina frequência, atraso, score composto, tendência, paridade, primos/Fibonacci e quadrantes",
  },
];

export const GENERATION_MODES: {
  value: GenerationMode;
  label: string;
  description: string;
}[] = [
  {
    value: "CONSERVATIVE",
    label: "Conservador",
    description: "Mais peso em frequência e padrões históricos estáveis",
  },
  {
    value: "BALANCED",
    label: "Equilibrado",
    description: "Balanceamento entre todas as heurísticas",
  },
  {
    value: "AGGRESSIVE",
    label: "Agressivo / experimental",
    description: "Mais peso em atraso e scores compostos",
  },
];
