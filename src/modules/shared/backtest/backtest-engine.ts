import { type GameRules } from "../constants";
import { type DrawRecord } from "../repository/base-repository";
import { PredictionGenerator } from "../prediction/prediction-generator";
import type { GenerationMode } from "../prediction/types";
import {
  BACKTEST_DISCLAIMER,
  BACKTEST_ENGINE_VERSION,
  BACKTEST_LIMITATIONS,
  DEFAULT_BACKTEST_STRATEGIES,
  type BacktestContestPoint,
  type BacktestReport,
  type BacktestRequest,
  type BacktestStrategyReport,
} from "./types";
import {
  buildStrategyReport,
  countHits,
  randomTicket,
  rankStrategies,
} from "./metrics";
import { scoreTicket } from "../prediction/scoring";
import { AnalyticsEngine } from "../analytics/analytics-engine";

export class BacktestEngine {
  constructor(
    private readonly rules: GameRules,
    private readonly draws: DrawRecord[]
  ) {}

  run(request: BacktestRequest = {}): BacktestReport | null {
    const mode: GenerationMode = request.mode ?? "BALANCED";
    const windowSize = request.windowSize ?? 50;
    const trainMinDraws = request.trainMinDraws ?? 80;
    const strategies =
      request.strategies ?? DEFAULT_BACKTEST_STRATEGIES;
    const includeRandom = request.includeRandomBaseline ?? true;
    const persistDetails = request.persistDetails ?? false;

    const sorted = [...this.draws].sort(
      (a, b) => a.contestNumber - b.contestNumber
    );

    if (sorted.length < trainMinDraws + 5) return null;

    let testDraws = sorted;
    if (request.fromContest) {
      testDraws = testDraws.filter(
        (d) => d.contestNumber >= request.fromContest!
      );
    }
    if (request.toContest) {
      testDraws = testDraws.filter(
        (d) => d.contestNumber <= request.toContest!
      );
    }

    if (testDraws.length > windowSize) {
      testDraws = testDraws.slice(-windowSize);
    }

    const strategyReports: BacktestStrategyReport[] = [];

    for (const strategy of strategies) {
      const points = this.runWalkForward(
        sorted,
        testDraws,
        trainMinDraws,
        (train, target) => {
          const generator = new PredictionGenerator(this.rules, train);
          const result = generator.generate({
            strategy,
            mode,
            seed: target.contestNumber * 997 + strategy.length,
          });
          const p = result.prediction!;
          return {
            numbers: p.numbers,
            score: p.score,
          };
        }
      );

      if (points.length === 0) continue;

      const report = buildStrategyReport(
        this.rules.slug,
        strategy,
        strategy,
        points,
        this.rules.pickCount
      );
      if (!persistDetails) delete report.contestPoints;
      strategyReports.push(report);
    }

    let baselineRandom: BacktestStrategyReport | undefined;
    if (includeRandom) {
      const points = this.runWalkForward(
        sorted,
        testDraws,
        trainMinDraws,
        (train, target) => {
          const numbers = randomTicket(
            this.rules.minNumber,
            this.rules.maxNumber,
            this.rules.pickCount,
            target.contestNumber
          );
          const analytics = new AnalyticsEngine(this.rules, train);
          const report = analytics.compute();
          const score = scoreTicket(this.rules, numbers, report);
          return { numbers, score };
        }
      );

      if (points.length > 0) {
        baselineRandom = buildStrategyReport(
          this.rules.slug,
          "RANDOM",
          "RANDOM",
          points,
          this.rules.pickCount
        );
        if (!persistDetails) delete baselineRandom.contestPoints;
      }
    }

    const ranking = rankStrategies(strategyReports);

    const fromContest =
      testDraws.length > 0 ? testDraws[0].contestNumber : null;
    const toContest =
      testDraws.length > 0
        ? testDraws[testDraws.length - 1].contestNumber
        : null;

    return {
      meta: {
        engineVersion: BACKTEST_ENGINE_VERSION,
        gameSlug: this.rules.slug,
        computedAt: new Date().toISOString(),
        fromContest,
        toContest,
        windowSize,
        trainMinDraws,
        mode,
        contestsTested: testDraws.length,
        disclaimer: BACKTEST_DISCLAIMER,
        limitations: BACKTEST_LIMITATIONS,
      },
      ranking,
      baselineRandom,
    };
  }

  private runWalkForward(
    allDraws: DrawRecord[],
    testDraws: DrawRecord[],
    trainMinDraws: number,
    predict: (
      train: DrawRecord[],
      target: DrawRecord
    ) => { numbers: number[]; score: number }
  ): BacktestContestPoint[] {
    const points: BacktestContestPoint[] = [];

    for (const target of testDraws) {
      const train = allDraws.filter(
        (d) => d.contestNumber < target.contestNumber
      );
      if (train.length < trainMinDraws) continue;

      const { numbers, score } = predict(train, target);
      points.push({
        contestNumber: target.contestNumber,
        predictedNumbers: numbers,
        actualNumbers: target.numbers,
        hits: countHits(numbers, target.numbers),
        predictedScore: score,
      });
    }

    return points;
  }
}
