import { type GameRules } from "../../constants";
import { type DrawRecord } from "../../repository/base-repository";
import type {
  PerDrawCategoryDistribution,
  SpecialNumberCategoryStudy,
  SpecialNumbersAnalysis,
} from "../types";
import {
  buildNumberSetLookup,
  getFibonacciInUniverse,
  getPrimesInUniverse,
  theoreticalMeanPerDraw,
} from "../utils/number-sets";

function buildPerDrawDistribution(
  perDrawCounts: number[],
  maxCount: number
): PerDrawCategoryDistribution[] {
  const total = perDrawCounts.length;

  return Array.from({ length: maxCount + 1 }, (_, count) => {
    const occurrences = perDrawCounts.filter((c) => c === count).length;
    return {
      count,
      occurrences,
      percentage: total > 0 ? (occurrences / total) * 100 : 0,
    };
  });
}

function computeCategoryStudy(
  rules: GameRules,
  draws: DrawRecord[],
  categoryNumbers: number[],
  categoryLabel: string,
  otherLabel: string
): SpecialNumberCategoryStudy {
  const categorySet = buildNumberSetLookup(categoryNumbers);
  let categoryTotal = 0;
  let otherTotal = 0;
  const perDrawCounts: number[] = [];
  const frequencyMap = new Map<number, number>();
  categoryNumbers.forEach((n) => frequencyMap.set(n, 0));

  draws.forEach((draw) => {
    let inCategory = 0;
    draw.numbers.forEach((n) => {
      if (categorySet.has(n)) {
        inCategory++;
        categoryTotal++;
        frequencyMap.set(n, (frequencyMap.get(n) ?? 0) + 1);
      } else {
        otherTotal++;
      }
    });
    perDrawCounts.push(inCategory);
  });

  const grandTotal = categoryTotal + otherTotal;
  const meanPerDraw =
    perDrawCounts.length > 0
      ? perDrawCounts.reduce((s, c) => s + c, 0) / perDrawCounts.length
      : 0;

  const distribution = buildPerDrawDistribution(
    perDrawCounts,
    rules.drawCount
  );

  const dominant = distribution.reduce(
    (best, row) => (row.occurrences > best.occurrences ? row : best),
    distribution[0] ?? { count: 0, occurrences: 0, percentage: 0 }
  );

  return {
    label: categoryLabel,
    numbersInUniverse: categoryNumbers,
    universeCount: categoryNumbers.length,
    aggregate: {
      count: categoryTotal,
      percentage: grandTotal > 0 ? (categoryTotal / grandTotal) * 100 : 0,
    },
    complementary: {
      label: otherLabel,
      count: otherTotal,
      percentage: grandTotal > 0 ? (otherTotal / grandTotal) * 100 : 0,
    },
    meanPerDraw,
    theoreticalMeanPerDraw: theoreticalMeanPerDraw(
      rules,
      categoryNumbers.length
    ),
    perDrawDistribution: distribution,
    dominantCountPerDraw: {
      count: dominant.count,
      percentage: dominant.percentage,
    },
    frequencyByNumber: categoryNumbers.map((number) => {
      const count = frequencyMap.get(number) ?? 0;
      const totalAppearances = draws.length;
      return {
        number,
        count,
        percentage:
          totalAppearances > 0 ? (count / totalAppearances) * 100 : 0,
      };
    }),
  };
}

export function computeSpecialNumbersAnalysis(
  rules: GameRules,
  draws: DrawRecord[]
): SpecialNumbersAnalysis {
  const primes = getPrimesInUniverse(rules);
  const fibonacci = getFibonacciInUniverse(rules);

  return {
    primes: computeCategoryStudy(
      rules,
      draws,
      primes,
      "Primos",
      "Não primos"
    ),
    fibonacci: computeCategoryStudy(
      rules,
      draws,
      fibonacci,
      "Fibonacci",
      "Demais dezenas"
    ),
    definition:
      "Contagem histórica de dezenas primas e da sequência de Fibonacci presentes no universo de cada modalidade.",
  };
}
