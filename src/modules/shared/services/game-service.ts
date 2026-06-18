import { PredictionStrategy, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  GAMES,
  type GameSlug,
  isGameSlug,
} from "../constants";
import { type DrawFilter, type PredictionResult } from "../types";
import { getRepository as resolveRepository } from "../repository/registry";
import { getIngestionService } from "../etl/ingestion-registry";
import { type IngestionOptions } from "../etl/types";
import { analyticsPipeline } from "../analytics/analytics-pipeline.service";
import type { FullAnalyticsReport } from "../analytics/types";
import { getPredictionService } from "../prediction/prediction-registry";
import type {
  GeneratedPrediction,
  GenerationRequest,
  GenerationResult,
} from "../prediction/types";
import {
  runBacktestPipeline,
  listBacktestRuns,
  getBacktestRun,
} from "../backtest/backtest-pipeline.service";
import type { BacktestRequest } from "../backtest/types";

export { resolveRepository as getRepository };

export async function getAnalytics(
  slug: GameSlug,
  filter?: DrawFilter,
  options?: { persist?: boolean }
): Promise<FullAnalyticsReport> {
  const { report } = await analyticsPipeline.run(slug, {
    filter,
    persist: options?.persist ?? false,
    triggeredBy: "api",
  });
  return report;
}

export async function runAnalyticsPipeline(
  slug: GameSlug,
  filter?: DrawFilter
) {
  return analyticsPipeline.run(slug, {
    filter,
    persist: true,
    triggeredBy: "cli",
  });
}

export async function generatePrediction(
  slug: GameSlug,
  strategy: PredictionStrategy = PredictionStrategy.HYBRID,
  options?: {
    count?: number;
    excludeNumbers?: number[];
    includeNumbers?: number[];
    mode?: GenerationRequest["mode"];
    filter?: GenerationRequest["filter"];
    seed?: number;
  }
): Promise<PredictionResult> {
  const result = await generatePredictions(slug, {
    strategy: strategy as GenerationRequest["strategy"],
    ...options,
  });
  return toPredictionResult(result.prediction!);
}

export async function generatePredictions(
  slug: GameSlug,
  request: GenerationRequest = {}
): Promise<GenerationResult & { savedId?: string }> {
  if (!isGameSlug(slug)) throw new Error(`Invalid game: ${slug}`);

  const service = getPredictionService(slug);
  const result = await service.generate(request);

  if (request.persist && result.prediction) {
    const saved = await saveGeneratedPrediction(slug, result.prediction, request.notes, {
      analysisRunId: request.analysisRunId,
      configId: request.configId,
    });
    return { ...result, savedId: saved.id };
  }

  if (request.persist && result.batch) {
    const ids: string[] = [];
    for (const p of result.batch.predictions) {
      const saved = await saveGeneratedPrediction(slug, p, request.notes, {
        analysisRunId: request.analysisRunId,
        configId: request.configId,
      });
      ids.push(saved.id);
    }
    return { ...result, savedId: ids[0] };
  }

  return result;
}

export async function comparePredictionStrategies(
  slug: GameSlug,
  request: GenerationRequest = {}
) {
  if (!isGameSlug(slug)) throw new Error(`Invalid game: ${slug}`);
  const service = getPredictionService(slug);
  return service.compare(request);
}

function toPredictionResult(p: GeneratedPrediction): PredictionResult {
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

export async function saveGeneratedPrediction(
  slug: GameSlug,
  prediction: GeneratedPrediction,
  notes?: string,
  links?: { analysisRunId?: string; configId?: string }
) {
  const data = {
    numbers: prediction.numbers,
    strategy: prediction.strategy,
    confidence: prediction.confidence,
    metadata: JSON.parse(
      JSON.stringify({
        ...prediction.metadata,
        hash: prediction.hash,
        strategyDetail: prediction.strategyDetail,
        mode: prediction.mode,
        parameters: prediction.parameters,
        score: prediction.score,
        explanation: prediction.explanation,
        explanationDetails: prediction.explanationDetails,
        timestamp: prediction.timestamp,
      })
    ) as Prisma.InputJsonValue,
    notes,
    analysisRunId: links?.analysisRunId,
    configId: links?.configId,
  };

  switch (slug) {
    case "lotofacil":
      return prisma.lotofacilPrediction.create({ data });
    case "megasena":
      return prisma.megasenaPrediction.create({ data });
    case "quina":
      return prisma.quinaPrediction.create({ data });
  }
}

export async function savePrediction(
  slug: GameSlug,
  result: PredictionResult,
  notes?: string
) {
  const data = {
    numbers: result.numbers,
    strategy: result.strategy as PredictionStrategy,
    confidence: result.confidence,
    metadata: {
      ...result.metadata,
      hash: result.hash,
      explanation: result.explanation,
      score: result.score,
    } as Prisma.InputJsonValue,
    notes,
  };

  switch (slug) {
    case "lotofacil":
      return prisma.lotofacilPrediction.create({ data });
    case "megasena":
      return prisma.megasenaPrediction.create({ data });
    case "quina":
      return prisma.quinaPrediction.create({ data });
  }
}

export async function getPredictions(slug: GameSlug, limit = 20) {
  switch (slug) {
    case "lotofacil":
      return prisma.lotofacilPrediction.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    case "megasena":
      return prisma.megasenaPrediction.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    case "quina":
      return prisma.quinaPrediction.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
      });
  }
}

export async function getDashboardStats() {
  const stats = await Promise.all(
    (Object.keys(GAMES) as GameSlug[]).map(async (slug) => {
      const repo = resolveRepository(slug);
      const count = await repo.count();
      const latest = await repo.getLatestContest();
      const draws = await repo.findMany({ limit: 1 });
      return {
        slug,
        name: GAMES[slug].name,
        shortName: GAMES[slug].shortName,
        color: GAMES[slug].color,
        gradient: GAMES[slug].gradient,
        description: GAMES[slug].description,
        totalDraws: count,
        latestContest: latest,
        lastDrawDate: draws[0]?.drawDate ?? null,
      };
    })
  );
  return stats;
}

export async function syncGame(
  slug: GameSlug,
  maxContests?: number,
  options?: Partial<IngestionOptions>
) {
  if (!isGameSlug(slug)) throw new Error(`Invalid game: ${slug}`);

  const result = await getIngestionService(slug).runIncremental({
    maxContests,
    triggeredBy: "api",
    ...options,
  });

  return {
    added: result.contestsAdded,
    updated: result.contestsUpdated,
    skipped: result.contestsSkipped,
    failed: result.contestsFailed,
    total: result.contestsTotal,
    lastContest: result.lastContestProcessed,
    batchId: result.batchId,
    status: result.status,
  };
}

export async function loadGameHistory(
  slug: GameSlug,
  options?: Partial<IngestionOptions>
) {
  if (!isGameSlug(slug)) throw new Error(`Invalid game: ${slug}`);

  const result = await getIngestionService(slug).runFull({
    triggeredBy: "api",
    ...options,
  });

  return {
    added: result.contestsAdded,
    updated: result.contestsUpdated,
    skipped: result.contestsSkipped,
    failed: result.contestsFailed,
    total: result.contestsTotal,
    lastContest: result.lastContestProcessed,
    batchId: result.batchId,
    status: result.status,
  };
}

export async function reprocessGame(
  slug: GameSlug,
  fromContest: number,
  toContest: number,
  options?: Partial<IngestionOptions>
) {
  if (!isGameSlug(slug)) throw new Error(`Invalid game: ${slug}`);

  const result = await getIngestionService(slug).runReprocess(
    fromContest,
    toContest,
    { triggeredBy: "api", ...options }
  );

  return {
    added: result.contestsAdded,
    updated: result.contestsUpdated,
    skipped: result.contestsSkipped,
    failed: result.contestsFailed,
    total: result.contestsTotal,
    lastContest: result.lastContestProcessed,
    batchId: result.batchId,
    status: result.status,
  };
}

export async function getSyncLogs(limit = 10) {
  return prisma.importBatch.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
    include: { dataSource: { select: { code: true, name: true } } },
  });
}

export async function runBacktest(
  slug: GameSlug,
  request: BacktestRequest = {}
) {
  if (!isGameSlug(slug)) throw new Error(`Invalid game: ${slug}`);
  return runBacktestPipeline(slug, request);
}

export async function getBacktestHistory(slug: GameSlug, limit = 20) {
  if (!isGameSlug(slug)) throw new Error(`Invalid game: ${slug}`);
  return listBacktestRuns(slug, limit);
}

export async function getBacktestById(id: string) {
  return getBacktestRun(id);
}
