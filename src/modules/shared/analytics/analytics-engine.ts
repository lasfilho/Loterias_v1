import { type GameRules } from "../constants";
import { type DrawFilter } from "../types";
import { type DrawRecord } from "../repository/base-repository";
import {
  computeFrequency,
  computeHotCold,
  computeOccurrenceHistogram,
} from "./basic/frequency";
import {
  computeExtendedDelays,
  toLegacyDelayStats,
} from "./basic/delay";
import {
  computeConsecutiveRepetition,
  computeParity,
  computeRanges,
  computeSumStatistics,
} from "./basic/distributions";
import { computeSpecialNumbersAnalysis } from "./basic/special-numbers";
import {
  computeCooccurrences,
  computeCycles,
  computeGapDistribution,
  computeMovingWindows,
  computeMultiHorizonTrends,
  computePairs,
  computeSequencePatterns,
  computeTriples,
  toLegacyTrends,
} from "./intermediate/patterns";
import {
  buildExplainability,
  computeCompositeScores,
  computeCoverage,
  computeDiversity,
  computeProbabilisticRanking,
  runBacktest,
  runMonteCarlo,
} from "./advanced/heuristics";
import { getGameAnalyticsExtension } from "./game-extensions.registry";
import { filterDraws } from "./utils/draw-utils";
import {
  ANALYTICS_DISCLAIMER,
  ANALYTICS_ENGINE_VERSION,
  ANALYTICS_LIMITATIONS,
  type FullAnalyticsReport,
} from "./types";

export class AnalyticsEngine {
  constructor(
    private readonly rules: GameRules,
    private readonly draws: DrawRecord[]
  ) {}

  compute(filter?: DrawFilter): FullAnalyticsReport {
    const filtered = filterDraws(this.draws, filter);
    const totalDraws = filtered.length;
    const latest = filtered[0];

    const frequency = computeFrequency(this.rules, filtered);
    const { hot, cold } = computeHotCold(frequency);
    const extendedDelays = computeExtendedDelays(this.rules, filtered);
    const delays = toLegacyDelayStats(extendedDelays);
    const parity = computeParity(filtered);
    const ranges = computeRanges(this.rules, filtered);
    const sumStatistics = computeSumStatistics(filtered);
    const consecutiveRepetition = computeConsecutiveRepetition(filtered);
    const occurrenceHistogram = computeOccurrenceHistogram(frequency);
    const specialNumbers = computeSpecialNumbersAnalysis(this.rules, filtered);

    const movingWindows = computeMovingWindows(this.rules, filtered);
    const multiHorizonTrends = computeMultiHorizonTrends(this.rules, filtered);
    const trends = toLegacyTrends(multiHorizonTrends);
    const cycles = computeCycles(this.rules, filtered);
    const topPairs = computePairs(filtered);
    const topTriples = computeTriples(filtered);
    const cooccurrences = computeCooccurrences(this.rules, filtered);
    const gapDistribution = computeGapDistribution(filtered);
    const sequencePatterns = computeSequencePatterns(filtered);

    const extension = getGameAnalyticsExtension(this.rules.slug);
    const frameCore =
      extension.getFrameCore?.(filtered, this.rules) ?? null;
    const lineColumn = extension.getLineColumn?.(filtered, this.rules);

    const compositeScores = computeCompositeScores(
      frequency,
      extendedDelays,
      multiHorizonTrends
    );
    const topComposite = compositeScores.slice(0, this.rules.pickCount);
    const topNumbers = topComposite.map((c) => c.number);

    const advanced = {
      compositeScores,
      probabilisticRanking: computeProbabilisticRanking(compositeScores),
      monteCarlo: runMonteCarlo(this.rules),
      backtest: runBacktest(this.rules, filtered),
      coverage: computeCoverage(this.rules, topNumbers),
      diversity: computeDiversity(this.rules, topNumbers),
      explainability: buildExplainability(compositeScores),
    };

    const gameSpecific = {
      slug: this.rules.slug,
      data: extension.compute(filtered, this.rules),
    };

    return {
      meta: {
        engineVersion: ANALYTICS_ENGINE_VERSION,
        computedAt: new Date().toISOString(),
        gameSlug: this.rules.slug,
        totalDraws,
        lastContest: latest?.contestNumber ?? null,
        lastDrawDate: latest?.drawDate ?? null,
        filterApplied: filter ?? {},
        disclaimer: ANALYTICS_DISCLAIMER,
        limitations: ANALYTICS_LIMITATIONS,
      },
      basic: {
        frequency,
        delays: extendedDelays,
        parity,
        ranges,
        sumStatistics,
        consecutiveRepetition,
        occurrenceHistogram,
        specialNumbers,
        hotNumbers: hot,
        coldNumbers: cold,
      },
      intermediate: {
        movingWindows,
        multiHorizonTrends,
        cycles,
        frameCore,
        topPairs,
        topTriples,
        cooccurrences,
        gapDistribution,
        sequencePatterns,
        lineColumn,
      },
      advanced,
      gameSpecific,
      totalDraws,
      lastContest: latest?.contestNumber ?? null,
      lastDrawDate: latest?.drawDate ?? null,
      frequency,
      delays,
      topPairs,
      trends,
      parity,
      ranges,
      hotNumbers: hot,
      coldNumbers: cold,
    };
  }
}
