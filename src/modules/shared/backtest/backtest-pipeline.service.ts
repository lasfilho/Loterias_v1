import { BacktestStatus, Prisma, type GameType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGameRules, type GameSlug } from "../constants";
import { getRepository } from "../repository/registry";
import { BacktestEngine } from "./backtest-engine";
import type { BacktestReport, BacktestRequest } from "./types";

function slugToGameType(slug: GameSlug): GameType {
  return getGameRules(slug).gameType;
}

export async function runBacktestPipeline(
  slug: GameSlug,
  request: BacktestRequest = {}
): Promise<{ report: BacktestReport; runId?: string }> {
  const rules = getGameRules(slug);
  const repo = getRepository(slug);
  const draws = await repo.findMany();

  const run = request.persist
    ? await prisma.backtestRun.create({
        data: {
          gameType: slugToGameType(slug),
          status: BacktestStatus.RUNNING,
          triggeredBy: request.triggeredBy ?? "api",
          mode: request.mode ?? "BALANCED",
          fromContest: request.fromContest,
          toContest: request.toContest,
          windowSize: request.windowSize ?? 50,
          trainMinDraws: request.trainMinDraws ?? 80,
          persistDetails: request.persistDetails ?? false,
          strategiesTested: request.strategies ?? [],
          disclaimer: "",
        },
      })
    : null;

  try {
    const engine = new BacktestEngine(rules, draws);
    const report = engine.run({
      ...request,
      persistDetails: request.persistDetails ?? false,
    });

    if (!report) {
      if (run) {
        await prisma.backtestRun.update({
          where: { id: run.id },
          data: {
            status: BacktestStatus.FAILED,
            finishedAt: new Date(),
            errorMessage: "Dados insuficientes para backtest",
          },
        });
      }
      throw new Error(
        "Dados insuficientes para backtest. Importe mais concursos ou reduza trainMinDraws."
      );
    }

    if (run) {
      await persistBacktestRun(run.id, report, request.persistDetails ?? false);
      return { report, runId: run.id };
    }

    return { report };
  } catch (error) {
    if (run) {
      await prisma.backtestRun.update({
        where: { id: run.id },
        data: {
          status: BacktestStatus.FAILED,
          finishedAt: new Date(),
          errorMessage:
            error instanceof Error ? error.message : "Erro no backtest",
        },
      });
    }
    throw error;
  }
}

async function persistBacktestRun(
  runId: string,
  report: BacktestReport,
  persistDetails: boolean
) {
  const allStrategies = [
    ...report.ranking,
    ...(report.baselineRandom ? [report.baselineRandom] : []),
  ];

  for (const s of allStrategies) {
    await prisma.backtestStrategyResult.create({
      data: {
        backtestRunId: runId,
        strategy: s.strategy,
        strategyDetail: s.strategyDetail,
        rank: s.rank,
        contestsTested: s.contestsTested,
        meanHits: s.meanHits,
        medianHits: s.medianHits,
        stdDevHits: s.stdDevHits,
        maxHits: s.maxHits,
        minHits: s.minHits,
        hitRateByLevel: JSON.parse(
          JSON.stringify(s.hitRateByLevel)
        ) as Prisma.InputJsonValue,
        hitBandRates: JSON.parse(
          JSON.stringify(s.hitBandRates)
        ) as Prisma.InputJsonValue,
        partialHitRate: s.partialHitRate,
        partialHitThreshold: s.partialHitThreshold,
        partialStreakStats: JSON.parse(
          JSON.stringify(s.partialStreakStats)
        ) as Prisma.InputJsonValue,
        scoreCorrelation: s.scoreCorrelation,
        meanPredictedScore: s.meanPredictedScore,
        periodAggregates: JSON.parse(
          JSON.stringify(s.periodAggregates)
        ) as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });

    if (persistDetails && s.contestPoints?.length) {
      await prisma.backtestContestResult.createMany({
        data: s.contestPoints.map((p) => ({
          backtestRunId: runId,
          strategy: s.strategy,
          contestNumber: p.contestNumber,
          predictedNumbers: p.predictedNumbers,
          actualNumbers: p.actualNumbers,
          hits: p.hits,
          predictedScore: p.predictedScore,
        })),
      });
    }
  }

  await prisma.backtestRun.update({
    where: { id: runId },
    data: {
      status: BacktestStatus.SUCCESS,
      finishedAt: new Date(),
      disclaimer: report.meta.disclaimer,
      contestsTested: report.meta.contestsTested,
      fromContest: report.meta.fromContest,
      toContest: report.meta.toContest,
      strategiesTested: allStrategies.map((s) => s.strategy),
      metadata: JSON.parse(
        JSON.stringify({
          limitations: report.meta.limitations,
          engineVersion: report.meta.engineVersion,
        })
      ),
    },
  });
}

export async function listBacktestRuns(slug: GameSlug, limit = 20) {
  return prisma.backtestRun.findMany({
    where: { gameType: slugToGameType(slug) },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      strategyResults: {
        orderBy: { rank: "asc" },
      },
    },
  });
}

export async function getBacktestRun(id: string) {
  return prisma.backtestRun.findUnique({
    where: { id },
    include: {
      strategyResults: { orderBy: { rank: "asc" } },
      contestResults: {
        orderBy: [{ strategy: "asc" }, { contestNumber: "asc" }],
        take: 500,
      },
    },
  });
}
