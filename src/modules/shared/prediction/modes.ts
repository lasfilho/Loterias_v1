import type { GenerationMode, StrategyWeights } from "./types";

export const MODE_WEIGHTS: Record<GenerationMode, StrategyWeights> = {
  CONSERVATIVE: {
    frequency: 0.4,
    delay: 0.14,
    composite: 0.18,
    hotCold: 0.1,
    pattern: 0.1,
    primeFibonacci: 0.08,
  },
  BALANCED: {
    frequency: 0.22,
    delay: 0.22,
    composite: 0.22,
    hotCold: 0.14,
    pattern: 0.1,
    primeFibonacci: 0.1,
  },
  AGGRESSIVE: {
    frequency: 0.08,
    delay: 0.32,
    composite: 0.32,
    hotCold: 0.12,
    pattern: 0.05,
    primeFibonacci: 0.11,
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
    merged.pattern +
    merged.primeFibonacci;
  if (sum <= 0) return base;
  return {
    frequency: merged.frequency / sum,
    delay: merged.delay / sum,
    composite: merged.composite / sum,
    hotCold: merged.hotCold / sum,
    pattern: merged.pattern / sum,
    primeFibonacci: merged.primeFibonacci / sum,
  };
}
