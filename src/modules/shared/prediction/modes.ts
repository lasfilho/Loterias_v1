import type { GenerationMode, StrategyWeights } from "./types";

export const MODE_WEIGHTS: Record<GenerationMode, StrategyWeights> = {
  CONSERVATIVE: {
    frequency: 0.45,
    delay: 0.15,
    composite: 0.2,
    hotCold: 0.1,
    pattern: 0.1,
  },
  BALANCED: {
    frequency: 0.25,
    delay: 0.25,
    composite: 0.25,
    hotCold: 0.15,
    pattern: 0.1,
  },
  AGGRESSIVE: {
    frequency: 0.1,
    delay: 0.35,
    composite: 0.35,
    hotCold: 0.15,
    pattern: 0.05,
  },
};

export function resolveWeights(
  mode: GenerationMode,
  overrides?: Partial<StrategyWeights>
): StrategyWeights {
  const base = { ...MODE_WEIGHTS[mode] };
  if (!overrides) return base;
  const merged = { ...base, ...overrides };
  const sum =
    merged.frequency +
    merged.delay +
    merged.composite +
    merged.hotCold +
    merged.pattern;
  if (sum <= 0) return base;
  return {
    frequency: merged.frequency / sum,
    delay: merged.delay / sum,
    composite: merged.composite / sum,
    hotCold: merged.hotCold / sum,
    pattern: merged.pattern / sum,
  };
}
