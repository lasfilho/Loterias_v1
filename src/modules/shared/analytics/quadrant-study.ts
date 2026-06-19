import { type DrawRecord } from "../repository/base-repository";
import {
  buildQuadrantNumberMap,
  countQuadrants,
  formatQuadrantPattern,
  sortPatternKey,
  type QuadrantId,
  type QuadrantVolanteLayout,
} from "./quadrant-volante";

export interface QuadrantAggregateStat {
  quadrant: QuadrantId;
  label: string;
  totalNumbers: number;
  percentage: number;
  meanPerDraw: number;
  theoreticalMeanPerDraw: number;
  deviationPct: number;
}

export interface QuadrantPatternBucket {
  patternLabel: string;
  sortedKey: string;
  counts: [number, number, number, number];
  occurrences: number;
  percentage: number;
  theoreticalPct: number;
  isBalanced: boolean;
}

export interface QuadrantStudy {
  layout: QuadrantVolanteLayout;
  aggregate: QuadrantAggregateStat[];
  meanPerQuadrant: [number, number, number, number];
  theoreticalMeanPerQuadrant: [number, number, number, number];
  patternDistribution: QuadrantPatternBucket[];
  dominantPattern: {
    patternLabel: string;
    sortedKey: string;
    percentage: number;
    counts: [number, number, number, number];
  };
  balancedDrawsCount: number;
  balancedDrawsPct: number;
  theoreticalBalancedPct: number;
  chiSquare: {
    statistic: number;
    degreesOfFreedom: number;
    isSignificantAt05: boolean;
    interpretation: string;
  };
  relevance: {
    score: "low" | "moderate" | "high";
    summary: string;
    recommendation: string;
  };
  quadrantNumbers: Record<QuadrantId, number[]>;
  definition: string;
  recentWindow: {
    size: number;
    meanPerQuadrant: [number, number, number, number];
    balancedPct: number;
    dominantPattern: string;
  };
  recentDraws: Array<{
    contestNumber: number;
    counts: [number, number, number, number];
    patternLabel: string;
    sortedKey: string;
    isBalanced: boolean;
  }>;
}

const RECENT_WINDOW = 30;

function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

function theoreticalOrderedPatternProbability(
  layout: QuadrantVolanteLayout,
  counts: [number, number, number, number]
): number {
  const [n1, n2, n3, n4] = counts;
  const pick = layout.drawCount;
  if (n1 + n2 + n3 + n4 !== pick) return 0;

  const sizes = [
    layout.quadrantSizes[1],
    layout.quadrantSizes[2],
    layout.quadrantSizes[3],
    layout.quadrantSizes[4],
  ];

  if (sizes.some((size, i) => counts[i] > size || counts[i] < 0)) return 0;

  const numerator =
    comb(sizes[0], n1) *
    comb(sizes[1], n2) *
    comb(sizes[2], n3) *
    comb(sizes[3], n4);

  return numerator / comb(layout.universeSize, pick);
}

function theoreticalSortedPatternProbability(
  layout: QuadrantVolanteLayout,
  sortedKey: string
): number {
  let total = 0;
  const pick = layout.drawCount;

  function enumerate(remaining: number, idx: number, current: number[]) {
    if (idx === 4) {
      if (remaining === 0 && sortPatternKey(current as [number, number, number, number]) === sortedKey) {
        total += theoreticalOrderedPatternProbability(
          layout,
          current as [number, number, number, number]
        );
      }
      return;
    }

    const maxForQuadrant = Math.min(
      remaining,
      layout.quadrantSizes[(idx + 1) as QuadrantId]
    );
    for (let n = 0; n <= maxForQuadrant; n++) {
      current[idx] = n;
      enumerate(remaining - n, idx + 1, current);
    }
  }

  enumerate(pick, 0, [0, 0, 0, 0]);
  return total;
}

export function isBalancedQuadrantSplit(
  layout: QuadrantVolanteLayout,
  counts: [number, number, number, number]
): boolean {
  const pick = layout.drawCount;
  const minExpected = Math.floor(pick / 4);
  const maxExpected = Math.ceil(pick / 4);

  const noExtreme = counts.every((c) => c <= maxExpected + 1);
  const noEmpty = counts.every((c) => c >= 1);

  if (pick === 6) {
    return noEmpty && noExtreme && counts.every((c) => c <= 3);
  }

  return (
    counts.every((c) => c >= minExpected && c <= maxExpected + 1) && noExtreme
  );
}

function computeTheoreticalBalancedPct(layout: QuadrantVolanteLayout): number {
  let sum = 0;
  const pick = layout.drawCount;

  function enumerate(remaining: number, idx: number, current: number[]) {
    if (idx === 4) {
      if (remaining === 0) {
        const counts = current as [number, number, number, number];
        if (isBalancedQuadrantSplit(layout, counts)) {
          sum += theoreticalOrderedPatternProbability(layout, counts);
        }
      }
      return;
    }

    const maxForQuadrant = Math.min(
      remaining,
      layout.quadrantSizes[(idx + 1) as QuadrantId]
    );
    for (let n = 0; n <= maxForQuadrant; n++) {
      current[idx] = n;
      enumerate(remaining - n, idx + 1, current);
    }
  }

  enumerate(pick, 0, [0, 0, 0, 0]);
  return sum * 100;
}

function chiSquarePValue(chi2: number, df: number): number {
  if (df <= 0 || chi2 <= 0) return 1;
  const z = Math.pow(chi2 / df, 1 / 3) - (1 - 2 / (9 * df));
  const denom = Math.sqrt(2 / (9 * df));
  const normalZ = z / denom;
  const p =
    0.5 *
    (1 +
      Math.sign(normalZ) *
        Math.sqrt(1 - Math.exp((-2 * normalZ * normalZ) / Math.PI)));
  return Math.max(0, Math.min(1, 1 - p));
}

function buildRelevance(
  chiSquare: QuadrantStudy["chiSquare"],
  maxDeviationPct: number,
  balancedObserved: number,
  balancedTheoretical: number
): QuadrantStudy["relevance"] {
  const balancedDelta = Math.abs(balancedObserved - balancedTheoretical);

  if (chiSquare.isSignificantAt05 || maxDeviationPct > 8) {
    return {
      score: "moderate",
      summary:
        "Há desvios mensuráveis em relação ao modelo aleatório uniforme, mas ainda modestos frente ao tamanho da amostra.",
      recommendation:
        "Útil como filtro de diversidade espacial no volante, não como preditor isolado.",
    };
  }

  if (maxDeviationPct > 4 || balancedDelta > 5) {
    return {
      score: "low",
      summary:
        "Pequenas variações entre quadrantes, compatíveis com flutuação natural de sorteios aleatórios.",
      recommendation:
        "Pode orientar palpites mais espalhados no cartão; não indica quadrante quente confiável.",
    };
  }

  return {
    score: "low",
    summary:
      "Distribuição por quadrantes muito próxima do esperado teoricamente — padrão espacial fraco.",
    recommendation:
      "Análise descritiva válida, porém com baixo poder preditivo para concursos futuros.",
  };
}

export function computeQuadrantStudyForLayout(
  draws: DrawRecord[],
  layout: QuadrantVolanteLayout
): QuadrantStudy {
  const patternMap = new Map<string, QuadrantPatternBucket>();
  const quadrantTotals: [number, number, number, number] = [0, 0, 0, 0];
  let balancedDraws = 0;
  const perDraw: QuadrantStudy["recentDraws"] = [];

  draws.forEach((d) => {
    const counts = countQuadrants(d.numbers, layout);
    counts.forEach((c, i) => {
      quadrantTotals[i] += c;
    });

    const patternLabel = formatQuadrantPattern(counts);
    const sortedKey = sortPatternKey(counts);
    const balanced = isBalancedQuadrantSplit(layout, counts);
    if (balanced) balancedDraws++;

    const existing = patternMap.get(sortedKey);
    if (existing) {
      existing.occurrences++;
    } else {
      patternMap.set(sortedKey, {
        patternLabel: sortedKey,
        sortedKey,
        counts,
        occurrences: 1,
        percentage: 0,
        theoreticalPct: 0,
        isBalanced: balanced,
      });
    }

    perDraw.push({
      contestNumber: d.contestNumber,
      counts,
      patternLabel,
      sortedKey,
      isBalanced: balanced,
    });
  });

  const totalDraws = draws.length;
  const theoreticalMeanPerQuadrant: [number, number, number, number] = [
    (layout.drawCount * layout.quadrantSizes[1]) / layout.universeSize,
    (layout.drawCount * layout.quadrantSizes[2]) / layout.universeSize,
    (layout.drawCount * layout.quadrantSizes[3]) / layout.universeSize,
    (layout.drawCount * layout.quadrantSizes[4]) / layout.universeSize,
  ];

  const meanPerQuadrant: [number, number, number, number] = [
    totalDraws > 0 ? quadrantTotals[0] / totalDraws : 0,
    totalDraws > 0 ? quadrantTotals[1] / totalDraws : 0,
    totalDraws > 0 ? quadrantTotals[2] / totalDraws : 0,
    totalDraws > 0 ? quadrantTotals[3] / totalDraws : 0,
  ];

  const totalNumbers = quadrantTotals.reduce((s, c) => s + c, 0);
  const aggregate: QuadrantAggregateStat[] = ([1, 2, 3, 4] as QuadrantId[]).map(
    (q) => {
      const idx = q - 1;
      const theoreticalMean = theoreticalMeanPerQuadrant[idx];
      const mean = meanPerQuadrant[idx];
      const deviationPct =
        theoreticalMean > 0
          ? ((mean - theoreticalMean) / theoreticalMean) * 100
          : 0;

      return {
        quadrant: q,
        label: layout.quadrantLabels[q],
        totalNumbers: quadrantTotals[idx],
        percentage:
          totalNumbers > 0 ? (quadrantTotals[idx] / totalNumbers) * 100 : 0,
        meanPerDraw: mean,
        theoreticalMeanPerDraw: theoreticalMean,
        deviationPct,
      };
    }
  );

  const expectedTotals = theoreticalMeanPerQuadrant.map(
    (m) => m * totalDraws
  ) as [number, number, number, number];

  let chi2 = 0;
  for (let i = 0; i < 4; i++) {
    const exp = expectedTotals[i];
    if (exp > 0) {
      chi2 += Math.pow(quadrantTotals[i] - exp, 2) / exp;
    }
  }

  const pValue = chiSquarePValue(chi2, 3);
  const isSignificant = pValue < 0.05;

  const patternDistribution: QuadrantPatternBucket[] = Array.from(
    patternMap.values()
  ).map((bucket) => ({
    ...bucket,
    percentage: totalDraws > 0 ? (bucket.occurrences / totalDraws) * 100 : 0,
    theoreticalPct:
      theoreticalSortedPatternProbability(layout, bucket.sortedKey) * 100,
    isBalanced: isBalancedQuadrantSplit(layout, bucket.counts),
  }));

  patternDistribution.sort((a, b) => b.occurrences - a.occurrences);

  const dominant = patternDistribution[0] ?? {
    sortedKey: "—",
    counts: [0, 0, 0, 0] as [number, number, number, number],
    percentage: 0,
  };

  const theoreticalBalancedPct = computeTheoreticalBalancedPct(layout);
  const balancedDrawsPct =
    totalDraws > 0 ? (balancedDraws / totalDraws) * 100 : 0;

  const maxDeviationPct = Math.max(
    ...aggregate.map((a) => Math.abs(a.deviationPct))
  );

  const recent = perDraw.slice(0, RECENT_WINDOW);
  const recentMeans: [number, number, number, number] = [0, 0, 0, 0];
  recent.forEach((d) => {
    d.counts.forEach((c, i) => {
      recentMeans[i] += c;
    });
  });
  if (recent.length > 0) {
    for (let i = 0; i < 4; i++) recentMeans[i] /= recent.length;
  }

  const recentBalanced =
    recent.length > 0
      ? (recent.filter((d) => d.isBalanced).length / recent.length) * 100
      : 0;

  const recentPatternCounts = new Map<string, number>();
  recent.forEach((d) => {
    recentPatternCounts.set(
      d.sortedKey,
      (recentPatternCounts.get(d.sortedKey) ?? 0) + 1
    );
  });
  const recentDominant =
    [...recentPatternCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "—";

  const gridLabel =
    layout.slug === "megasena"
      ? "volante 6×10 (60 dezenas)"
      : "volante 8×10 (80 dezenas)";

  const chiSquareBlock = {
    statistic: chi2,
    degreesOfFreedom: 3,
    isSignificantAt05: isSignificant,
    interpretation: isSignificant
      ? `Desvio estatisticamente detectável (χ²=${chi2.toFixed(2)}, p≈${pValue.toFixed(3)}), porém esperado em amostras longas mesmo sob aleatoriedade.`
      : `Sem evidência forte de viés entre quadrantes (χ²=${chi2.toFixed(2)}, p≈${pValue.toFixed(3)}).`,
  };

  return {
    layout,
    aggregate,
    meanPerQuadrant,
    theoreticalMeanPerQuadrant,
    patternDistribution,
    dominantPattern: {
      patternLabel: dominant.sortedKey,
      sortedKey: dominant.sortedKey,
      percentage: dominant.percentage,
      counts: dominant.counts,
    },
    balancedDrawsCount: balancedDraws,
    balancedDrawsPct,
    theoreticalBalancedPct,
    chiSquare: chiSquareBlock,
    relevance: buildRelevance(
      chiSquareBlock,
      maxDeviationPct,
      balancedDrawsPct,
      theoreticalBalancedPct
    ),
    quadrantNumbers: buildQuadrantNumberMap(layout),
    definition: `Quadrantes do ${gridLabel}: Q1 e Q2 na metade superior (esquerda/direita), Q3 e Q4 na inferior. Cada quadrante concentra ${layout.quadrantSizes[1]} dezenas.`,
    recentWindow: {
      size: recent.length,
      meanPerQuadrant: recentMeans,
      balancedPct: recentBalanced,
      dominantPattern: recentDominant,
    },
    recentDraws: perDraw.slice(0, 20),
  };
}
