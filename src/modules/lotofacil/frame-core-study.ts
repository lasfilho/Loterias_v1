import type { FrameCoreStat } from "../shared/analytics/types";
import { type DrawRecord } from "../shared/repository/base-repository";
import {
  countLotofacilFrameCore,
  isBalancedFrameCoreSplit,
  LOTOFACIL_CORE_NUMBERS,
  LOTOFACIL_FRAME_CORE_BALANCE,
  LOTOFACIL_FRAME_NUMBERS,
  lotofacilToGridPosition,
  isLotofacilFrameCell,
} from "./volante.constants";

export interface FrameCoreSplitBucket {
  frameCount: number;
  coreCount: number;
  occurrences: number;
  percentage: number;
  theoreticalPct: number;
  isBalanced: boolean;
}

export interface LotofacilFrameCoreStudy {
  aggregate: FrameCoreStat;
  meanFramePerDraw: number;
  meanCorePerDraw: number;
  balancedDrawsCount: number;
  balancedDrawsPct: number;
  splitDistribution: FrameCoreSplitBucket[];
  dominantSplit: {
    frameCount: number;
    coreCount: number;
    percentage: number;
  };
  recentWindow: {
    size: number;
    meanFrame: number;
    meanCore: number;
    balancedPct: number;
  };
  frameNumbers: number[];
  coreNumbers: number[];
  expectedRange: typeof LOTOFACIL_FRAME_CORE_BALANCE;
  theoreticalBalancedPct: number;
  definition: string;
  recentDraws: Array<{
    contestNumber: number;
    frameCount: number;
    coreCount: number;
    isBalanced: boolean;
  }>;
}

const PICK_COUNT = 15;
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

/** P(k dezenas da moldura em 15 sorteadas) — hipergeométrica. */
function theoreticalFrameProbability(frameCount: number): number {
  const coreCount = PICK_COUNT - frameCount;
  if (frameCount < 0 || frameCount > 16 || coreCount < 0 || coreCount > 9) {
    return 0;
  }
  const total = comb(25, PICK_COUNT);
  return (comb(16, frameCount) * comb(9, coreCount)) / total;
}

function computeTheoreticalBalancedPct(): number {
  let sum = 0;
  for (let frame = 0; frame <= PICK_COUNT; frame++) {
    const core = PICK_COUNT - frame;
    if (isBalancedFrameCoreSplit(frame, core)) {
      sum += theoreticalFrameProbability(frame);
    }
  }
  return sum * 100;
}

const THEORETICAL_BALANCED_PCT = computeTheoreticalBalancedPct();

export function computeLotofacilFrameCoreStudy(
  draws: DrawRecord[]
): LotofacilFrameCoreStudy {
  const splitMap = new Map<string, number>();
  let totalFrameInDraws = 0;
  let totalCoreInDraws = 0;
  let balancedDraws = 0;
  const perDraw: Array<{
    contestNumber: number;
    frameCount: number;
    coreCount: number;
    isBalanced: boolean;
  }> = [];

  let aggregateFrame = 0;
  let aggregateCore = 0;

  draws.forEach((d) => {
    const { frameCount, coreCount } = countLotofacilFrameCore(d.numbers);
    totalFrameInDraws += frameCount;
    totalCoreInDraws += coreCount;
    aggregateFrame += frameCount;
    aggregateCore += coreCount;

    const balanced = isBalancedFrameCoreSplit(frameCount, coreCount);
    if (balanced) balancedDraws++;

    const key = `${frameCount}-${coreCount}`;
    splitMap.set(key, (splitMap.get(key) ?? 0) + 1);

    perDraw.push({
      contestNumber: d.contestNumber,
      frameCount,
      coreCount,
      isBalanced: balanced,
    });
  });

  const totalDraws = draws.length;
  const splitDistribution: FrameCoreSplitBucket[] = [];

  for (let frameCount = 0; frameCount <= PICK_COUNT; frameCount++) {
    const coreCount = PICK_COUNT - frameCount;
    if (coreCount > 9) continue;

    const key = `${frameCount}-${coreCount}`;
    const occurrences = splitMap.get(key) ?? 0;
    if (occurrences === 0 && theoreticalFrameProbability(frameCount) < 0.0001) {
      continue;
    }

    splitDistribution.push({
      frameCount,
      coreCount,
      occurrences,
      percentage: totalDraws > 0 ? (occurrences / totalDraws) * 100 : 0,
      theoreticalPct: theoreticalFrameProbability(frameCount) * 100,
      isBalanced: isBalancedFrameCoreSplit(frameCount, coreCount),
    });
  }

  splitDistribution.sort((a, b) => b.occurrences - a.occurrences);

  const dominant = splitDistribution[0] ?? {
    frameCount: 9,
    coreCount: 6,
    percentage: 0,
  };

  const recent = perDraw.slice(0, RECENT_WINDOW);
  const recentFrame =
    recent.length > 0
      ? recent.reduce((s, d) => s + d.frameCount, 0) / recent.length
      : 0;
  const recentCore =
    recent.length > 0
      ? recent.reduce((s, d) => s + d.coreCount, 0) / recent.length
      : 0;
  const recentBalanced =
    recent.length > 0
      ? (recent.filter((d) => d.isBalanced).length / recent.length) * 100
      : 0;

  const aggregateTotal = aggregateFrame + aggregateCore;

  return {
    aggregate: {
      frame: {
        count: aggregateFrame,
        percentage:
          aggregateTotal > 0 ? (aggregateFrame / aggregateTotal) * 100 : 0,
      },
      core: {
        count: aggregateCore,
        percentage:
          aggregateTotal > 0 ? (aggregateCore / aggregateTotal) * 100 : 0,
      },
      definition:
        "Moldura: 16 dezenas da borda do volante 5×5; Centro: 9 dezenas do miolo interno.",
    },
    meanFramePerDraw: totalDraws > 0 ? totalFrameInDraws / totalDraws : 0,
    meanCorePerDraw: totalDraws > 0 ? totalCoreInDraws / totalDraws : 0,
    balancedDrawsCount: balancedDraws,
    balancedDrawsPct: totalDraws > 0 ? (balancedDraws / totalDraws) * 100 : 0,
    splitDistribution,
    dominantSplit: {
      frameCount: dominant.frameCount,
      coreCount: dominant.coreCount,
      percentage: dominant.percentage,
    },
    recentWindow: {
      size: recent.length,
      meanFrame: recentFrame,
      meanCore: recentCore,
      balancedPct: recentBalanced,
    },
    frameNumbers: [...LOTOFACIL_FRAME_NUMBERS],
    coreNumbers: [...LOTOFACIL_CORE_NUMBERS],
    expectedRange: { ...LOTOFACIL_FRAME_CORE_BALANCE },
    theoreticalBalancedPct: THEORETICAL_BALANCED_PCT,
    definition:
      "Por concurso, a maioria dos sorteios concentra 9–10 dezenas na moldura e 5–6 no centro (equilíbrio espacial do volante).",
    recentDraws: perDraw.slice(0, 20),
  };
}

/** Compatível com extensão analítica legada. */
export function computeLotofacilAggregateFrameCore(
  draws: DrawRecord[]
): FrameCoreStat {
  return computeLotofacilFrameCoreStudy(draws).aggregate;
}

export function classifyLotofacilNumber(number: number): "frame" | "core" {
  const { line, column } = lotofacilToGridPosition(number);
  return isLotofacilFrameCell(line, column) ? "frame" : "core";
}
