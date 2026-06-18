import { createHash } from "crypto";
import type { GameSlug } from "../constants";
import type { GenerationStrategy } from "./types";

export function createPredictionHash(
  slug: GameSlug,
  numbers: number[],
  strategy: GenerationStrategy,
  timestamp: string
): string {
  const payload = `${slug}:${numbers.join("-")}:${strategy}:${timestamp}`;
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export function createSeededRng(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}
