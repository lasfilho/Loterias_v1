import { getGameRules, type GameSlug } from "../constants";
import { getRepository } from "../repository/registry";
import { LotofacilPredictionService } from "../../lotofacil/prediction.service";
import { MegasenaPredictionService } from "../../megasena/prediction.service";
import { QuinaPredictionService } from "../../quina/prediction.service";
import type { GenerationRequest, GenerationResult } from "./types";
import type { StrategyComparisonItem } from "./types";
import type { DrawFilter } from "../types";

export function getPredictionService(slug: GameSlug, filter?: DrawFilter) {
  return {
    async generate(request?: GenerationRequest): Promise<GenerationResult> {
      const repo = getRepository(slug);
      const rules = getGameRules(slug);
      const loaded = await repo.findMany(request?.filter ?? filter);
      return createService(slug, rules, loaded).generate(request);
    },
    async compare(
      request?: GenerationRequest
    ): Promise<StrategyComparisonItem[]> {
      const repo = getRepository(slug);
      const rules = getGameRules(slug);
      const loaded = await repo.findMany(request?.filter ?? filter);
      return createService(slug, rules, loaded).compare(request);
    },
  };
}

function createService(
  slug: GameSlug,
  rules: ReturnType<typeof getGameRules>,
  draws: Awaited<ReturnType<ReturnType<typeof getRepository>["findMany"]>>
) {
  switch (slug) {
    case "lotofacil":
      return new LotofacilPredictionService(rules, draws);
    case "megasena":
      return new MegasenaPredictionService(rules, draws);
    case "quina":
      return new QuinaPredictionService(rules, draws);
  }
}
