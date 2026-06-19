import type { FullAnalyticsReport } from "../analytics/types";
import type { GameRules } from "../constants";
import { computeDiversity } from "../analytics/advanced/heuristics";
import { specialNumbersAlignmentBonus } from "./special-numbers-heuristics";
import { quadrantBalanceBonus } from "./quadrant-prediction.heuristics";

export function scoreTicket(
  rules: GameRules,
  numbers: number[],
  report: FullAnalyticsReport
): number {
  const compositeMap = new Map(
    report.advanced.compositeScores.map((c) => [c.number, c.score])
  );
  const avgComposite =
    numbers.reduce((s, n) => s + (compositeMap.get(n) ?? 0), 0) / numbers.length;

  const diversity = computeDiversity(rules, numbers);
  const freqMap = new Map(report.frequency.map((f) => [f.number, f.percentage]));
  const avgFreq =
    numbers.reduce((s, n) => s + (freqMap.get(n) ?? 0), 0) / numbers.length;
  const maxFreq = Math.max(...report.frequency.map((f) => f.percentage), 1);

  const normalizedFreq = avgFreq / maxFreq;
  const diversityBonus = diversity.score * 0.2;
  const concentrationMalus = diversity.concentrationPenalty * 0.15;
  const specialBonus = specialNumbersAlignmentBonus(numbers, report);
  const quadrantBonus = quadrantBalanceBonus(numbers, report);

  return Math.min(
    1,
    Math.max(
      0,
      avgComposite * 0.5 +
        normalizedFreq * 0.3 +
        diversityBonus +
        specialBonus +
        quadrantBonus -
        concentrationMalus
    )
  );
}
