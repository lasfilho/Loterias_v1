/**
 * @deprecated Use PredictionGenerator from ./prediction-generator
 * Mantido para compatibilidade com imports existentes.
 */
import { PredictionStrategy } from "@prisma/client";
import { type GameRules } from "../constants";
import { type DrawRecord } from "../repository/base-repository";
import { type PredictionResult } from "../types";
import { PredictionGenerator } from "./prediction-generator";
import type { GenerationStrategy } from "./types";

export interface PredictionConfig {
  strategy: PredictionStrategy;
  count?: number;
  excludeNumbers?: number[];
  includeNumbers?: number[];
  seed?: number;
}

export class PredictionEngine {
  private readonly generator: PredictionGenerator;

  constructor(rules: GameRules, draws: DrawRecord[]) {
    this.generator = new PredictionGenerator(rules, draws);
  }

  generate(config: PredictionConfig): PredictionResult {
    const strategy = config.strategy as GenerationStrategy;
    const result = this.generator.generate({
      strategy,
      count: config.count,
      excludeNumbers: config.excludeNumbers,
      includeNumbers: config.includeNumbers,
      seed: config.seed,
    });

    const p = result.prediction!;
    return {
      numbers: p.numbers,
      strategy: p.strategy,
      confidence: p.confidence,
      metadata: p.metadata,
      hash: p.hash,
      gameSlug: p.gameSlug,
      strategyDetail: p.strategyDetail,
      mode: p.mode,
      parameters: p.parameters,
      score: p.score,
      explanation: p.explanation,
      explanationDetails: p.explanationDetails,
      timestamp: p.timestamp,
    };
  }
}

export { PredictionGenerator };
