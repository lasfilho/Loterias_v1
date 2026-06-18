import { getGameRules, type GameSlug } from "../../constants";
import { type GameRepository } from "../../repository/base-repository";
import { createCaixaAdapter } from "../adapters/caixa-api.adapter";
import { EtlPipeline } from "../pipeline/etl-pipeline";
import { type DrawSourceAdapter } from "../types";
import { type IngestionOptions, type IngestionResult } from "../types";

export abstract class BaseIngestionService {
  abstract readonly slug: GameSlug;
  protected abstract readonly repository: GameRepository;
  protected abstract createAdapter(): DrawSourceAdapter;

  async run(options: IngestionOptions = {}): Promise<IngestionResult> {
    const rules = getGameRules(this.slug);
    const adapter = this.createAdapter();
    const repo = this.repository;

    const pipeline = new EtlPipeline({
      rules,
      adapter,
      load: (input) => repo.upsertWithContext(input),
      contestExists: (n) => repo.contestExists(n),
      getLatestContest: () => repo.getLatestContest(),
      countDraws: () => repo.count(),
    });

    return pipeline.run(options);
  }

  async runFull(options: Omit<IngestionOptions, "mode"> = {}) {
    return this.run({ ...options, mode: "full" });
  }

  async runIncremental(options: Omit<IngestionOptions, "mode"> = {}) {
    return this.run({ ...options, mode: "incremental" });
  }

  async runReprocess(
    fromContest: number,
    toContest: number,
    options: Omit<IngestionOptions, "mode" | "fromContest" | "toContest"> = {}
  ) {
    return this.run({
      ...options,
      mode: "reprocess",
      fromContest,
      toContest,
      forceUpdate: true,
    });
  }
}

export function createCaixaIngestionAdapter(slug: GameSlug) {
  return createCaixaAdapter(getGameRules(slug));
}
