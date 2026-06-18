import type { FullAnalyticsReport } from "../analytics/types";
import type { GeneratedPrediction } from "./types";

export function buildExplanation(
  numbers: number[],
  report: FullAnalyticsReport,
  strategyLabel: string,
  modeLabel: string,
  validationReasons: string[]
): { summary: string; details: GeneratedPrediction["explanationDetails"] } {
  const compositeMap = new Map(
    report.advanced.compositeScores.map((c) => [c.number, c])
  );

  const details = numbers.map((n) => {
    const entry = report.advanced.explainability.find((e) => e.number === n);
    const composite = compositeMap.get(n);
    const reasons =
      entry?.reasons ??
      (composite
        ? [`Score composto ${(composite.score * 100).toFixed(0)}%`]
        : ["Selecionado por heurística da estratégia"]);

    return {
      number: n,
      reasons,
      compositeScore: composite?.score ?? entry?.compositeScore ?? 0,
    };
  });

  const hotHits = numbers.filter((n) => report.hotNumbers.includes(n)).length;
  const coldHits = numbers.filter((n) => report.coldNumbers.includes(n)).length;

  let summary =
    `Palpite ${strategyLabel} (${modeLabel}): ${numbers.length} dezenas ` +
    `baseadas em ${report.totalDraws} concursos. ` +
    `${hotHits} quentes, ${coldHits} frias. ` +
    `Heurístico — sem garantia de acerto.`;

  if (validationReasons.length > 0) {
    summary += ` Avisos: ${validationReasons.join("; ")}.`;
  }

  return { summary, details };
}
