import { type GameRules } from "../constants";
import { AnalyticsEngine } from "../analytics/analytics-engine";
import { type DrawRecord } from "../repository/base-repository";
import { ANALYTICS_DISCLAIMER } from "../analytics/types";
import { GENERATION_MODES, GENERATION_STRATEGIES } from "./types";
import type {
  BatchGenerationResult,
  GeneratedPrediction,
  GenerationRequest,
  GenerationResult,
  GenerationStrategy,
  StrategyComparisonItem,
} from "./types";
import { toPrismaStrategy } from "./types";
import { resolveWeights } from "./modes";
import {
  batchDiversityScore,
  countDifferent,
  validateCombination,
} from "./heuristics";
import { scoreTicket } from "./scoring";
import {
  buildStrategyContext,
  executeStrategy,
  finalizeSelection,
} from "./strategies";
import { buildExplanation } from "./explain";
import { createPredictionHash, createSeededRng } from "./utils";
import type { DrawFilter } from "../types";

const MAX_REGENERATION_ATTEMPTS = 12;

export class PredictionGenerator {
  private readonly analytics: AnalyticsEngine;

  constructor(
    private readonly rules: GameRules,
    private readonly draws: DrawRecord[]
  ) {
    this.analytics = new AnalyticsEngine(rules, draws);
  }

  generate(request: GenerationRequest = {}): GenerationResult {
    if (request.batchSize && request.batchSize > 1) {
      return { batch: this.generateBatch(request) };
    }
    return { prediction: this.generateOne(request) };
  }

  compareStrategies(
    request: Omit<GenerationRequest, "strategy" | "batchSize"> = {}
  ): StrategyComparisonItem[] {
    const strategies: GenerationStrategy[] = [
      "FREQUENCY_WEIGHTED",
      "DELAY_BALANCED",
      "COMPOSITE_SCORE",
      "HOT_COLD_MIX",
      "PATTERN_AWARE",
      "HYBRID",
    ];

    return strategies.map((strategy) => ({
      strategy,
      prediction: this.generateOne({ ...request, strategy }),
    }));
  }

  private generateBatch(request: GenerationRequest): BatchGenerationResult {
    const size = request.batchSize ?? 3;
    const minDiversity =
      request.minDiversity ??
      Math.ceil((request.count ?? this.rules.pickCount) * 0.35);

    const predictions: GeneratedPrediction[] = [];
    const usedSets: number[][] = [];

    for (let i = 0; i < size; i++) {
      let attempt = 0;
      let prediction: GeneratedPrediction;

      do {
        prediction = this.generateOne({
          ...request,
          seed: request.seed !== undefined ? request.seed + i * 1000 + attempt : undefined,
        });
        attempt++;
      } while (
        attempt < 8 &&
        usedSets.some(
          (prev) => countDifferent(prev, prediction.numbers) < minDiversity
        )
      );

      predictions.push(prediction);
      usedSets.push(prediction.numbers);
    }

    return {
      predictions,
      diversityScore: batchDiversityScore(
        usedSets,
        request.count ?? this.rules.pickCount
      ),
    };
  }

  private generateOne(request: GenerationRequest): GeneratedPrediction {
    const strategy = request.strategy ?? "HYBRID";
    const mode = request.mode ?? "BALANCED";
    const pickCount = request.count ?? this.rules.pickCount;
    const exclude = new Set(request.excludeNumbers ?? []);
    const include = request.includeNumbers ?? [];
    const filter = request.filter;
    const drawFilter: DrawFilter | undefined = filter
      ? {
          fromContest: filter.fromContest,
          toContest: filter.toContest,
          fromDate: filter.fromDate,
          toDate: filter.toDate,
          limit: filter.limit,
        }
      : undefined;

    const report = this.analytics.compute(drawFilter);
    const weights = resolveWeights(mode, request.weights);
    const rng = createSeededRng(request.seed);

    const strategyMeta = GENERATION_STRATEGIES.find((s) => s.value === strategy);
    const modeMeta = GENERATION_MODES.find((m) => m.value === mode);

    let numbers: number[] = [];
    let validation = { valid: false, reasons: [] as string[], penalties: 1 };
    let attempts = 0;

    while (!validation.valid && attempts < MAX_REGENERATION_ATTEMPTS) {
      const ctx = buildStrategyContext(
        this.rules,
        report,
        weights,
        pickCount,
        exclude,
        include,
        rng,
        filter
      );

      numbers = executeStrategy(strategy, ctx);
      numbers = finalizeSelection(
        this.rules,
        numbers,
        pickCount,
        exclude,
        include,
        ctx.pool,
        rng
      );

      validation = validateCombination(this.rules, numbers, report);
      attempts++;
    }

    const timestamp = new Date().toISOString();
    const hash = createPredictionHash(
      this.rules.slug,
      numbers,
      strategy,
      timestamp
    );
    const ticketScore = scoreTicket(this.rules, numbers, report);
    const { summary, details } = buildExplanation(
      numbers,
      report,
      strategyMeta?.label ?? strategy,
      modeMeta?.label ?? mode,
      validation.reasons
    );

    return {
      hash,
      gameSlug: this.rules.slug,
      numbers,
      strategy: toPrismaStrategy(strategy),
      strategyDetail: strategy,
      mode,
      parameters: {
        pickCount,
        mode,
        strategy,
        weights,
        filter: filter ?? {},
        excludeNumbers: [...exclude],
        includeNumbers: include,
        seed: request.seed,
        attempts,
        validationPenalties: validation.penalties,
      },
      score: ticketScore,
      confidence: ticketScore,
      explanation: summary,
      explanationDetails: details,
      timestamp,
      metadata: {
        disclaimer: ANALYTICS_DISCLAIMER,
        totalDraws: report.totalDraws,
        hotNumbers: report.hotNumbers.slice(0, 8),
        coldNumbers: report.coldNumbers.slice(0, 8),
        parity: report.parity,
        validation: validation.reasons,
        engineVersion: report.meta.engineVersion,
        generatedAt: timestamp,
      },
    };
  }
}
