import type { GameAnalyticsExtension } from "../shared/analytics/types";
import { computeQuadrantStudyForLayout } from "../shared/analytics/quadrant-study";
import { QUINA_VOLANTE } from "../shared/analytics/quadrant-volante";
import { computeLinearFrameCore } from "../shared/analytics/intermediate/patterns";

export const quinaAnalyticsExtension: GameAnalyticsExtension = {
  slug: "quina",

  compute(draws, rules) {
    const octets = Array.from({ length: 10 }, (_, i) => {
      const start = rules.minNumber + i * 8;
      const end = Math.min(start + 7, rules.maxNumber);
      let count = 0;
      draws.forEach((d) => {
        d.numbers.forEach((n) => {
          if (n >= start && n <= end) count++;
        });
      });
      return { range: `${start}-${end}`, count };
    });

    return {
      octetDistribution: octets,
      frameCore: this.getFrameCore?.(draws, rules),
      quadrantStudy: computeQuadrantStudyForLayout(draws, QUINA_VOLANTE),
    };
  },

  getFrameCore(draws, rules) {
    return computeLinearFrameCore(rules, draws, 8);
  },
};
