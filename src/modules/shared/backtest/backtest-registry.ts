import { getGameRules, type GameSlug } from "../constants";
import { getRepository } from "../repository/registry";
import { LotofacilBacktestService } from "../../lotofacil/backtest.service";
import { MegasenaBacktestService } from "../../megasena/backtest.service";
import { QuinaBacktestService } from "../../quina/backtest.service";
import type { BacktestRequest, BacktestReport } from "./types";

export function getBacktestService(slug: GameSlug) {
  return {
    async run(request?: BacktestRequest): Promise<BacktestReport | null> {
      const rules = getGameRules(slug);
      const draws = await getRepository(slug).findMany();
      return createService(slug, rules, draws).run(request);
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
      return new LotofacilBacktestService(rules, draws);
    case "megasena":
      return new MegasenaBacktestService(rules, draws);
    case "quina":
      return new QuinaBacktestService(rules, draws);
  }
}
