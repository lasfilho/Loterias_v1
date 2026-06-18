import type {
  FrameCoreStat,
  GameAnalyticsExtension,
  LineColumnStat,
} from "../shared/analytics/types";
import { type DrawRecord } from "../shared/repository/base-repository";

/** Volante Lotofácil: 5 linhas × 5 colunas (1-25) */
function toLineCol(number: number): { line: number; column: number } {
  const idx = number - 1;
  return { line: Math.floor(idx / 5) + 1, column: (idx % 5) + 1 };
}

function isFrameCell(line: number, column: number): boolean {
  return line === 1 || line === 5 || column === 1 || column === 5;
}

export const lotofacilAnalyticsExtension: GameAnalyticsExtension = {
  slug: "lotofacil",

  compute(draws, rules) {
    const lineColumn = this.getLineColumn?.(draws, rules) ?? [];
    const frameCore = this.getFrameCore?.(draws, rules);

    const lineTotals = new Map<number, number>();
    const colTotals = new Map<number, number>();
    for (let i = 1; i <= 5; i++) {
      lineTotals.set(i, 0);
      colTotals.set(i, 0);
    }

    draws.forEach((d) => {
      d.numbers.forEach((n) => {
        const { line, column } = toLineCol(n);
        lineTotals.set(line, (lineTotals.get(line) ?? 0) + 1);
        colTotals.set(column, (colTotals.get(column) ?? 0) + 1);
      });
    });

    return {
      lineTotals: Object.fromEntries(lineTotals),
      columnTotals: Object.fromEntries(colTotals),
      frameCore,
      lineColumnGrid: lineColumn,
    };
  },

  getFrameCore(draws: DrawRecord[]): FrameCoreStat {
    let frameCount = 0;
    let coreCount = 0;

    draws.forEach((d) => {
      d.numbers.forEach((n) => {
        const { line, column } = toLineCol(n);
        if (isFrameCell(line, column)) frameCount++;
        else coreCount++;
      });
    });

    const total = frameCount + coreCount;
    return {
      frame: {
        count: frameCount,
        percentage: total > 0 ? (frameCount / total) * 100 : 0,
      },
      core: {
        count: coreCount,
        percentage: total > 0 ? (coreCount / total) * 100 : 0,
      },
      definition: "Moldura: borda do volante 5×5; Miolo: célula central (3,3)",
    };
  },

  getLineColumn(draws: DrawRecord[]): LineColumnStat[] {
    const counts = new Map<string, number>();
    let total = 0;

    draws.forEach((d) => {
      d.numbers.forEach((n) => {
        const { line, column } = toLineCol(n);
        const key = `${line}-${column}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
        total++;
      });
    });

    const stats: LineColumnStat[] = [];
    counts.forEach((count, key) => {
      const [line, column] = key.split("-").map(Number);
      stats.push({
        line,
        column,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      });
    });

    return stats.sort((a, b) => b.count - a.count);
  },
};

export function computeLotofacilMolduraMiolo(
  draws: DrawRecord[]
): FrameCoreStat {
  return lotofacilAnalyticsExtension.getFrameCore!(draws, {
    minNumber: 1,
    maxNumber: 25,
  } as import("../shared/constants").GameRules)!;
}
