import {
  AnalysisStatus,
  AnalysisType,
  Prisma,
  SnapshotType,
  TrendDirection,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getGameRules,
  type GameSlug,
} from "../constants";
import { AnalyticsEngine } from "./analytics-engine";
import { ANALYTICS_ENGINE_VERSION } from "./types";
import { type DrawFilter } from "../types";
import { getRepository } from "../repository/registry";
import type { FullAnalyticsReport } from "./types";

function filterHash(filter?: DrawFilter): string {
  if (!filter || Object.keys(filter).length === 0) return "all";
  return Buffer.from(JSON.stringify(filter)).toString("base64url").slice(0, 32);
}

function trendToEnum(
  direction: "up" | "down" | "stable"
): TrendDirection {
  switch (direction) {
    case "up":
      return TrendDirection.UP;
    case "down":
      return TrendDirection.DOWN;
    default:
      return TrendDirection.STABLE;
  }
}

export class AnalyticsPipelineService {
  async run(
    slug: GameSlug,
    options?: {
      filter?: DrawFilter;
      analysisType?: AnalysisType;
      triggeredBy?: string;
      persist?: boolean;
    }
  ): Promise<{ report: FullAnalyticsReport; runId?: string }> {
    const rules = getGameRules(slug);
    const repo = getRepository(slug);
    const draws = await repo.findMany(options?.filter);
    const engine = new AnalyticsEngine(rules, draws);
    const report = engine.compute(options?.filter);

    if (options?.persist === false) {
      return { report };
    }

    const runId = await this.persist(slug, report, {
      filter: options?.filter,
      analysisType: options?.analysisType ?? AnalysisType.ON_DEMAND,
      triggeredBy: options?.triggeredBy ?? "api",
    });

    return { report, runId };
  }

  private async persist(
    slug: GameSlug,
    report: FullAnalyticsReport,
    opts: {
      filter?: DrawFilter;
      analysisType: AnalysisType;
      triggeredBy: string;
    }
  ): Promise<string> {
    const rules = getGameRules(slug);
    const hash = filterHash(opts.filter);

    await prisma.analysisRun.updateMany({
      where: { gameType: rules.gameType, isLatest: true },
      data: { isLatest: false, status: AnalysisStatus.STALE },
    });

    await prisma.indicatorSnapshot.updateMany({
      where: { gameType: rules.gameType, filterHash: hash, isCurrent: true },
      data: { isCurrent: false, validUntil: new Date() },
    });

    const run = await prisma.analysisRun.create({
      data: {
        gameType: rules.gameType,
        analysisType: opts.analysisType,
        status: AnalysisStatus.SUCCESS,
        version: 1,
        engineVersion: ANALYTICS_ENGINE_VERSION,
        isLatest: true,
        triggeredBy: opts.triggeredBy,
        filterConfig: (opts.filter ?? {}) as Prisma.InputJsonValue,
        drawsAnalyzed: report.totalDraws,
        drawsFromContest: opts.filter?.fromContest,
        drawsToContest: opts.filter?.toContest,
        finishedAt: new Date(),
      },
    });

    const snapshotData = JSON.parse(JSON.stringify(report)) as Prisma.InputJsonValue;

    const snapshotTypes: SnapshotType[] = [
      SnapshotType.SUMMARY,
      SnapshotType.FREQUENCY,
      SnapshotType.DELAY,
      SnapshotType.PAIRS,
      SnapshotType.TRENDS,
    ];

    for (const snapshotType of snapshotTypes) {
      const data =
        snapshotType === SnapshotType.SUMMARY
          ? snapshotData
          : (JSON.parse(
              JSON.stringify(
                snapshotType === SnapshotType.FREQUENCY
                  ? report.basic.frequency
                  : snapshotType === SnapshotType.DELAY
                    ? report.basic.delays
                    : snapshotType === SnapshotType.PAIRS
                      ? report.intermediate.topPairs
                      : report.intermediate.multiHorizonTrends
              )
            ) as Prisma.InputJsonValue);

      await prisma.indicatorSnapshot.create({
        data: {
          analysisRunId: run.id,
          gameType: rules.gameType,
          snapshotType,
          filterHash: hash,
          filterConfig: (opts.filter ?? {}) as Prisma.InputJsonValue,
          isCurrent: true,
          data,
        },
      });
    }

    for (const f of report.basic.frequency) {
      const delay = report.basic.delays.find((d) => d.number === f.number);
      const trend = report.intermediate.multiHorizonTrends.find(
        (t) => t.number === f.number
      );

      await prisma.numberIndicator.create({
        data: {
          analysisRunId: run.id,
          gameType: rules.gameType,
          number: f.number,
          frequencyCount: f.count,
          frequencyPct: f.percentage,
          expectedFrequency: f.expected,
          deviation: f.deviation,
          delay: delay?.currentDelay ?? 0,
          lastContest: delay?.lastContest,
          avgDelay: delay?.avgDelay ?? 0,
          trend: trendToEnum(trend?.shortTerm.direction ?? "stable"),
          recentCount: Math.round(
            (trend?.shortTerm.recentRate ?? 0) *
              (trend?.shortTerm.windowSize ?? 0)
          ),
        },
      });
    }

    return run.id;
  }

  async getLatestReport(
    slug: GameSlug,
    filter?: DrawFilter
  ): Promise<FullAnalyticsReport | null> {
    const rules = getGameRules(slug);
    const hash = filterHash(filter);

    const snapshot = await prisma.indicatorSnapshot.findFirst({
      where: {
        gameType: rules.gameType,
        snapshotType: SnapshotType.SUMMARY,
        filterHash: hash,
        isCurrent: true,
      },
      orderBy: { computedAt: "desc" },
    });

    if (!snapshot) return null;
    return snapshot.data as unknown as FullAnalyticsReport;
  }
}

export const analyticsPipeline = new AnalyticsPipelineService();
