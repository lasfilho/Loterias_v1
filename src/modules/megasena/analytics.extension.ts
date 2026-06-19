import type { GameAnalyticsExtension } from "../shared/analytics/types";
import { computeQuadrantStudyForLayout } from "../shared/analytics/quadrant-study";
import { MEGASENA_VOLANTE } from "../shared/analytics/quadrant-volante";
import { computeLinearFrameCore } from "../shared/analytics/intermediate/patterns";

export const megasenaAnalyticsExtension: GameAnalyticsExtension = {
  slug: "megasena",

  compute(draws, rules) {
    const deciles = Array.from({ length: 6 }, (_, i) => {
      const start = rules.minNumber + i * 10;
      const end = Math.min(start + 9, rules.maxNumber);
      let count = 0;
      draws.forEach((d) => {
        d.numbers.forEach((n) => {
          if (n >= start && n <= end) count++;
        });
      });
      return { range: `${start}-${end}`, count };
    });

    return {
      decileDistribution: deciles,
      frameCore: this.getFrameCore?.(draws, rules),
      quadrantStudy: computeQuadrantStudyForLayout(draws, MEGASENA_VOLANTE),
    };
  },

  getFrameCore(draws, rules) {
    return computeLinearFrameCore(rules, draws, 6);
  },
};
