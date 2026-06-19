import type { GameRules, GameSlug } from "../constants";
import type { FullAnalyticsReport } from "../analytics/types";
import { isBalancedQuadrantSplit } from "../analytics/quadrant-study";
import type { QuadrantStudy } from "../analytics/quadrant-study";
import {
  countQuadrants,
  formatQuadrantPattern,
  numberToQuadrant,
  type QuadrantId,
} from "../analytics/quadrant-volante";

export function supportsQuadrantHeuristics(slug: GameSlug): boolean {
  return slug === "megasena" || slug === "quina";
}

export function getQuadrantStudyFromReport(
  report: FullAnalyticsReport
): QuadrantStudy | null {
  const study = report.gameSpecific?.data?.quadrantStudy as
    | QuadrantStudy
    | undefined;
  return study ?? null;
}

export function computeQuadrantTargets(
  study: QuadrantStudy
): [number, number, number, number] {
  const pick = study.layout.drawCount;
  const means = study.theoreticalMeanPerQuadrant;
  const targets: [number, number, number, number] = [
    Math.floor(means[0]),
    Math.floor(means[1]),
    Math.floor(means[2]),
    Math.floor(means[3]),
  ];

  const remainder = pick - targets.reduce((sum, value) => sum + value, 0);
  const fractions = means
    .map((mean, index) => ({ index, fraction: mean - Math.floor(mean) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < remainder; i++) {
    targets[fractions[i % 4].index]++;
  }

  return targets;
}

export function validateQuadrantCombination(
  rules: GameRules,
  numbers: number[],
  report: FullAnalyticsReport
): { reasons: string[]; penalty: number } {
  if (!supportsQuadrantHeuristics(rules.slug)) {
    return { reasons: [], penalty: 0 };
  }

  const study = getQuadrantStudyFromReport(report);
  if (!study) {
    return { reasons: [], penalty: 0 };
  }

  const counts = countQuadrants(numbers, study.layout);
  const reasons: string[] = [];
  let penalty = 0;

  if (counts.some((c) => c === 0)) {
    reasons.push("Quadrante vazio no volante");
    penalty += 0.25;
  }

  const maxInQuadrant = Math.max(...counts);
  const maxAllowed = rules.drawCount <= 6 ? 3 : 3;
  if (maxInQuadrant > maxAllowed) {
    reasons.push(
      `Concentração em um quadrante (${maxInQuadrant} dezenas em Q${counts.indexOf(maxInQuadrant) + 1})`
    );
    penalty += 0.3;
  }

  if (!isBalancedQuadrantSplit(study.layout, counts)) {
    reasons.push(
      `Padrão espacial ${formatQuadrantPattern(counts)} fora da faixa equilibrada`
    );
    penalty += 0.15;
  }

  return { reasons, penalty };
}

export function quadrantBalanceBonus(
  numbers: number[],
  report: FullAnalyticsReport
): number {
  const study = getQuadrantStudyFromReport(report);
  if (!study) return 0;

  const counts = countQuadrants(numbers, study.layout);
  if (isBalancedQuadrantSplit(study.layout, counts)) return 0.08;
  if (counts.every((c) => c >= 1)) return 0.04;
  return 0;
}

export function formatQuadrantSummary(
  numbers: number[],
  report: FullAnalyticsReport
): string | null {
  const study = getQuadrantStudyFromReport(report);
  if (!study) return null;

  const counts = countQuadrants(numbers, study.layout);
  const pattern = formatQuadrantPattern(counts);
  const balanced = isBalancedQuadrantSplit(study.layout, counts);
  return `Quadrantes Q1–Q4: ${pattern}${balanced ? " (equilibrado)" : ""}`;
}

function scoreNumber(report: FullAnalyticsReport, number: number): number {
  const composite = report.advanced.compositeScores.find(
    (entry) => entry.number === number
  );
  const frequency = report.frequency.find((entry) => entry.number === number);
  return (composite?.score ?? 0) + (frequency?.percentage ?? 0) / 1000;
}

export function nudgeQuadrantBalance(
  numbers: number[],
  rules: GameRules,
  report: FullAnalyticsReport,
  pool: number[],
  pickCount: number,
  exclude: Set<number>,
  include: number[]
): number[] {
  const study = getQuadrantStudyFromReport(report);
  if (!study || !supportsQuadrantHeuristics(rules.slug)) {
    return numbers;
  }

  const layout = study.layout;
  const targets = computeQuadrantTargets(study);
  const selected = new Set(numbers);
  const getQuadrant = (n: number): QuadrantId => numberToQuadrant(n, layout);

  const currentCounts = (): [number, number, number, number] =>
    countQuadrants(Array.from(selected), layout);

  const candidatesForQuadrant = (quadrant: QuadrantId) =>
    pool
      .filter((n) => !exclude.has(n) && !selected.has(n) && getQuadrant(n) === quadrant)
      .sort((a, b) => scoreNumber(report, b) - scoreNumber(report, a));

  for (let quadrant = 1; quadrant <= 4; quadrant++) {
    let counts = currentCounts();
    const idx = quadrant - 1;

    while (counts[idx] < targets[idx]) {
      const candidates = candidatesForQuadrant(quadrant as QuadrantId);
      if (candidates.length === 0) break;

      if (selected.size < pickCount) {
        selected.add(candidates[0]);
      } else {
        let swapFrom: QuadrantId | null = null;
        for (let q = 4; q >= 1; q--) {
          if (counts[q - 1] > targets[q - 1]) {
            swapFrom = q as QuadrantId;
            break;
          }
        }
        if (swapFrom === null) break;

        const removable = [...selected]
          .filter((n) => !include.includes(n) && getQuadrant(n) === swapFrom)
          .sort((a, b) => scoreNumber(report, a) - scoreNumber(report, b));
        if (removable.length === 0) break;

        selected.delete(removable[0]);
        selected.add(candidates[0]);
      }

      counts = currentCounts();
    }
  }

  for (let quadrant = 4; quadrant >= 1; quadrant--) {
    let counts = currentCounts();
    const idx = quadrant - 1;

    while (counts[idx] > targets[idx] + 1) {
      const removable = [...selected]
        .filter((n) => !include.includes(n) && getQuadrant(n) === quadrant)
        .sort((a, b) => scoreNumber(report, a) - scoreNumber(report, b));
      if (removable.length === 0) break;
      selected.delete(removable[0]);
      counts = currentCounts();
    }
  }

  return Array.from(selected).sort((a, b) => a - b).slice(0, pickCount);
}

export function describeQuadrantCombination(
  numbers: number[],
  report: FullAnalyticsReport
): Record<string, unknown> | null {
  const study = getQuadrantStudyFromReport(report);
  if (!study) return null;

  const counts = countQuadrants(numbers, study.layout);
  const targets = computeQuadrantTargets(study);

  return {
    pattern: formatQuadrantPattern(counts),
    sortedPattern: [...counts].sort((a, b) => b - a).join("-"),
    targets: targets.join("-"),
    isBalanced: isBalancedQuadrantSplit(study.layout, counts),
    dominantHistorical: study.dominantPattern.sortedKey,
    perQuadrant: {
      q1: counts[0],
      q2: counts[1],
      q3: counts[2],
      q4: counts[3],
    },
  };
}
