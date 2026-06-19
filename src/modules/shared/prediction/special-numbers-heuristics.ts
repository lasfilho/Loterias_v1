import type {
  FullAnalyticsReport,
  SpecialNumberCategoryStudy,
} from "../analytics/types";
import {
  buildNumberSetLookup,
} from "../analytics/utils/number-sets";

export interface SpecialNumbersTargets {
  primeSet: Set<number>;
  fibonacciSet: Set<number>;
  targetPrimeCount: number;
  targetFibonacciCount: number;
  primeMean: number;
  fibonacciMean: number;
}

export function resolveSpecialNumbersTargets(
  report: FullAnalyticsReport
): SpecialNumbersTargets {
  const { primes, fibonacci } = report.basic.specialNumbers;

  return {
    primeSet: buildNumberSetLookup(primes.numbersInUniverse),
    fibonacciSet: buildNumberSetLookup(fibonacci.numbersInUniverse),
    targetPrimeCount: Math.round(primes.meanPerDraw),
    targetFibonacciCount: Math.round(fibonacci.meanPerDraw),
    primeMean: primes.meanPerDraw,
    fibonacciMean: fibonacci.meanPerDraw,
  };
}

export function countSpecialNumbers(
  numbers: number[],
  set: Set<number>
): number {
  return numbers.filter((n) => set.has(n)).length;
}

function frequencyBoost(
  number: number,
  study: SpecialNumberCategoryStudy
): number {
  const row = study.frequencyByNumber.find((f) => f.number === number);
  if (!row) return 0;
  const maxPct = Math.max(
    ...study.frequencyByNumber.map((f) => f.percentage),
    1
  );
  return row.percentage / maxPct;
}

/** Score 0–1 por dezena com base na frequência histórica de primos/Fibonacci. */
export function computeSpecialNumberWeight(
  number: number,
  report: FullAnalyticsReport
): number {
  const { primes, fibonacci } = report.basic.specialNumbers;
  let score = 0;
  let parts = 0;

  if (primes.numbersInUniverse.includes(number)) {
    score += frequencyBoost(number, primes);
    parts++;
  }
  if (fibonacci.numbersInUniverse.includes(number)) {
    score += frequencyBoost(number, fibonacci);
    parts++;
  }

  return parts > 0 ? score / parts : 0;
}

export function specialNumbersAlignmentPenalty(
  numbers: number[],
  report: FullAnalyticsReport
): { penalty: number; reasons: string[] } {
  const targets = resolveSpecialNumbersTargets(report);
  const reasons: string[] = [];
  let penalty = 0;

  const primeCount = countSpecialNumbers(numbers, targets.primeSet);
  const fibCount = countSpecialNumbers(numbers, targets.fibonacciSet);

  const primeDrift = Math.abs(primeCount - targets.targetPrimeCount);
  const fibDrift = Math.abs(fibCount - targets.targetFibonacciCount);

  if (primeDrift > 2) {
    reasons.push(
      `Primos: ${primeCount} no palpite (média histórica ~${targets.primeMean.toFixed(1)})`
    );
    penalty += Math.min(0.25, primeDrift * 0.06);
  }

  if (fibDrift > 2) {
    reasons.push(
      `Fibonacci: ${fibCount} no palpite (média histórica ~${targets.fibonacciMean.toFixed(1)})`
    );
    penalty += Math.min(0.25, fibDrift * 0.06);
  }

  return { penalty, reasons };
}

export function specialNumbersAlignmentBonus(
  numbers: number[],
  report: FullAnalyticsReport
): number {
  const targets = resolveSpecialNumbersTargets(report);
  const primeCount = countSpecialNumbers(numbers, targets.primeSet);
  const fibCount = countSpecialNumbers(numbers, targets.fibonacciSet);

  const primeScore = 1 - Math.min(1, Math.abs(primeCount - targets.targetPrimeCount) / 3);
  const fibScore = 1 - Math.min(1, Math.abs(fibCount - targets.targetFibonacciCount) / 3);

  return (primeScore + fibScore) * 0.075;
}

export function formatSpecialNumbersSummary(
  numbers: number[],
  report: FullAnalyticsReport
): string {
  const targets = resolveSpecialNumbersTargets(report);
  const primeCount = countSpecialNumbers(numbers, targets.primeSet);
  const fibCount = countSpecialNumbers(numbers, targets.fibonacciSet);

  return `${primeCount} primos, ${fibCount} Fibonacci (médias hist. ~${targets.primeMean.toFixed(1)} / ~${targets.fibonacciMean.toFixed(1)})`;
}
