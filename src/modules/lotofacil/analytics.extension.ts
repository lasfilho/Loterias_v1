import type {
  FrameCoreStat,
  GameAnalyticsExtension,
  LineColumnStat,
} from "../shared/analytics/types";
import { type DrawRecord } from "../shared/repository/base-repository";
import {
  computeLotofacilAggregateFrameCore,
  computeLotofacilFrameCoreStudy,
} from "./frame-core-study";
import {
  lotofacilToGridPosition,
} from "./volante.constants";

export const lotofacilAnalyticsExtension: GameAnalyticsExtension = {
  slug: "lotofacil",

  compute(draws, rules) {
    const lineColumn = this.getLineColumn?.(draws, rules) ?? [];
    const frameCoreStudy = computeLotofacilFrameCoreStudy(draws);

    const lineTotals = new Map<number, number>();
    const colTotals = new Map<number, number>();
    for (let i = 1; i <= 5; i++) {
      lineTotals.set(i, 0);
      colTotals.set(i, 0);
    }

    draws.forEach((d) => {
      d.numbers.forEach((n) => {
        const { line, column } = lotofacilToGridPosition(n);
        lineTotals.set(line, (lineTotals.get(line) ?? 0) + 1);
        colTotals.set(column, (colTotals.get(column) ?? 0) + 1);
      });
    });

    return {
      lineTotals: Object.fromEntries(lineTotals),
      columnTotals: Object.fromEntries(colTotals),
      frameCore: frameCoreStudy.aggregate,
      frameCoreStudy,
      lineColumnGrid: lineColumn,
    };
  },

  getFrameCore(draws: DrawRecord[]): FrameCoreStat {
    return computeLotofacilAggregateFrameCore(draws);
  },

  getLineColumn(draws: DrawRecord[]): LineColumnStat[] {
    const counts = new Map<string, number>();
    let total = 0;

    draws.forEach((d) => {
      d.numbers.forEach((n) => {
        const { line, column } = lotofacilToGridPosition(n);
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

export function computeLotofacilMolduraMiolo(draws: DrawRecord[]) {
  return computeLotofacilFrameCoreStudy(draws);
}
