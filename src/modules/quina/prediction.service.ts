import { type GameRules } from "../shared/constants";
import { type DrawRecord } from "../shared/repository/base-repository";
import { PredictionGenerator } from "../shared/prediction/prediction-generator";
import type { GenerationRequest, GenerationResult } from "../shared/prediction/types";

export class QuinaPredictionService {
  private readonly generator: PredictionGenerator;

  constructor(rules: GameRules, draws: DrawRecord[]) {
    this.generator = new PredictionGenerator(rules, draws);
  }

  generate(request?: GenerationRequest): GenerationResult {
    return this.generator.generate(request);
  }

  compare(request?: GenerationRequest) {
    return this.generator.compareStrategies(request);
  }
}
