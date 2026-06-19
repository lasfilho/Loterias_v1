import { type GameRules } from "../constants";
import type { FullAnalyticsReport } from "../analytics/types";
import { getAllNumbers, validateDraw } from "../repository/base-repository";
import { specialNumbersAlignmentPenalty } from "./special-numbers-heuristics";

export interface HeuristicValidation {
  valid: boolean;
  reasons: string[];
  penalties: number;
}

export function validateCombination(
  rules: GameRules,
  numbers: number[],
  report: FullAnalyticsReport
): HeuristicValidation {
  const reasons: string[] = [];
  let penalties = 0;

  if (!validateDraw(rules, numbers)) {
    return { valid: false, reasons: ["Combinação inválida para as regras do jogo"], penalties: 1 };
  }

  const sorted = [...numbers].sort((a, b) => a - b);

  const maxConsecutive = maxConsecutiveRun(sorted);
  const maxAllowed = rules.drawCount <= 6 ? 2 : 4;
  if (maxConsecutive > maxAllowed) {
    reasons.push(`Sequência consecutiva longa (${maxConsecutive})`);
    penalties += 0.2;
  }

  const even = numbers.filter((n) => n % 2 === 0).length;
  const odd = numbers.length - even;
  if (even === 0 || odd === 0) {
    reasons.push("Paridade totalmente desbalanceada (só pares ou só ímpares)");
    penalties += 0.25;
  }

  const rangeBuckets = new Set(
    numbers.map((n) =>
      Math.floor(
        ((n - rules.minNumber) / (rules.maxNumber - rules.minNumber + 1)) * 5
      )
    )
  );
  if (rangeBuckets.size < 2 && rules.drawCount > 5) {
    reasons.push("Concentração excessiva em uma faixa numérica");
    penalties += 0.2;
  }

  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(sorted[i] - sorted[i - 1]);
  }
  if (gaps.length > 0 && gaps.every((g) => g <= 2)) {
    reasons.push("Dezenas excessivamente agrupadas");
    penalties += 0.15;
  }

  const diversity = report.advanced.diversity;
  if (diversity.concentrationPenalty > 0.35) {
    reasons.push("Alta penalidade de concentração no score de diversidade");
    penalties += diversity.concentrationPenalty * 0.3;
  }

  const special = specialNumbersAlignmentPenalty(numbers, report);
  if (special.reasons.length > 0) {
    reasons.push(...special.reasons);
    penalties += special.penalty;
  }

  const valid = penalties < 0.5;
  return { valid, reasons, penalties };
}

function maxConsecutiveRun(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  let max = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 1;
    }
  }
  return max;
}

export function countDifferent(a: number[], b: number[]): number {
  const setA = new Set(a);
  return b.filter((n) => !setA.has(n)).length;
}

export function batchDiversityScore(
  predictions: number[][],
  pickCount: number
): number {
  if (predictions.length < 2) return 1;
  let totalDiff = 0;
  let pairs = 0;
  for (let i = 0; i < predictions.length; i++) {
    for (let j = i + 1; j < predictions.length; j++) {
      totalDiff += countDifferent(predictions[i], predictions[j]);
      pairs++;
    }
  }
  const avgDiff = pairs > 0 ? totalDiff / pairs : pickCount;
  return Math.min(1, avgDiff / pickCount);
}

export function filterCandidatePool(
  rules: GameRules,
  report: FullAnalyticsReport,
  exclude: Set<number>,
  filter?: { minDelay?: number; maxDelay?: number; hotOnly?: boolean; coldOnly?: boolean }
): number[] {
  let pool = getAllNumbers(rules).filter((n) => !exclude.has(n));

  if (filter?.minDelay !== undefined) {
    const delayMap = new Map(report.basic.delays.map((d) => [d.number, d.currentDelay]));
    pool = pool.filter((n) => (delayMap.get(n) ?? 0) >= filter.minDelay!);
  }
  if (filter?.maxDelay !== undefined) {
    const delayMap = new Map(report.basic.delays.map((d) => [d.number, d.currentDelay]));
    pool = pool.filter((n) => (delayMap.get(n) ?? 0) <= filter.maxDelay!);
  }
  if (filter?.hotOnly) {
    pool = pool.filter((n) => report.hotNumbers.includes(n));
  }
  if (filter?.coldOnly) {
    pool = pool.filter((n) => report.coldNumbers.includes(n));
  }

  return pool.length > 0 ? pool : getAllNumbers(rules).filter((n) => !exclude.has(n));
}
