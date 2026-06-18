import { type GameRules } from "../shared/constants";
import { type DrawRecord } from "../shared/repository/base-repository";
import { PredictionGenerator } from "../shared/prediction/prediction-generator";
import type { GenerationRequest, GenerationResult } from "../shared/prediction/types";
import { validateLotofacilCombination } from "./prediction.rules";

export class LotofacilPredictionService {
  private readonly rules: GameRules;
  private readonly generator: PredictionGenerator;

  constructor(rules: GameRules, draws: DrawRecord[]) {
    this.rules = rules;
    this.generator = new PredictionGenerator(rules, draws);
  }

  generate(request?: GenerationRequest): GenerationResult {
    const result = this.generator.generate(request);
    if (result.prediction) {
      const extra = validateLotofacilCombination(result.prediction.numbers);
      result.prediction.metadata = {
        ...result.prediction.metadata,
        lotofacilRules: extra,
      };
    }
    return result;
  }

  compare(request?: GenerationRequest) {
    return this.generator.compareStrategies(request);
  }
}
