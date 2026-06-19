import type { GameSlug } from "../constants";

export type QuadrantId = 1 | 2 | 3 | 4;

export interface QuadrantVolanteLayout {
  slug: GameSlug;
  rows: number;
  cols: number;
  splitRow: number;
  splitCol: number;
  drawCount: number;
  universeSize: number;
  quadrantSizes: Record<QuadrantId, number>;
  quadrantLabels: Record<QuadrantId, string>;
}

export const MEGASENA_VOLANTE: QuadrantVolanteLayout = {
  slug: "megasena",
  rows: 6,
  cols: 10,
  splitRow: 3,
  splitCol: 5,
  drawCount: 6,
  universeSize: 60,
  quadrantSizes: { 1: 15, 2: 15, 3: 15, 4: 15 },
  quadrantLabels: {
    1: "Superior esquerdo",
    2: "Superior direito",
    3: "Inferior esquerdo",
    4: "Inferior direito",
  },
};

export const QUINA_VOLANTE: QuadrantVolanteLayout = {
  slug: "quina",
  rows: 8,
  cols: 10,
  splitRow: 4,
  splitCol: 5,
  drawCount: 5,
  universeSize: 80,
  quadrantSizes: { 1: 20, 2: 20, 3: 20, 4: 20 },
  quadrantLabels: {
    1: "Superior esquerdo",
    2: "Superior direito",
    3: "Inferior esquerdo",
    4: "Inferior direito",
  },
};

export function getQuadrantVolanteLayout(slug: GameSlug): QuadrantVolanteLayout | null {
  if (slug === "megasena") return MEGASENA_VOLANTE;
  if (slug === "quina") return QUINA_VOLANTE;
  return null;
}

export function numberToGridPosition(
  number: number,
  layout: QuadrantVolanteLayout
): { row: number; column: number } {
  const row = Math.ceil(number / layout.cols);
  const column = ((number - 1) % layout.cols) + 1;
  return { row, column };
}

export function numberToQuadrant(
  number: number,
  layout: QuadrantVolanteLayout
): QuadrantId {
  const { row, column } = numberToGridPosition(number, layout);
  const isTop = row <= layout.splitRow;
  const isLeft = column <= layout.splitCol;

  if (isTop && isLeft) return 1;
  if (isTop && !isLeft) return 2;
  if (!isTop && isLeft) return 3;
  return 4;
}

export function buildQuadrantNumberMap(
  layout: QuadrantVolanteLayout
): Record<QuadrantId, number[]> {
  const map: Record<QuadrantId, number[]> = { 1: [], 2: [], 3: [], 4: [] };

  for (let n = 1; n <= layout.universeSize; n++) {
    map[numberToQuadrant(n, layout)].push(n);
  }

  return map;
}

export function countQuadrants(
  numbers: number[],
  layout: QuadrantVolanteLayout
): [number, number, number, number] {
  const counts: [number, number, number, number] = [0, 0, 0, 0];
  numbers.forEach((n) => {
    const q = numberToQuadrant(n, layout);
    counts[q - 1]++;
  });
  return counts;
}

export function formatQuadrantPattern(
  counts: [number, number, number, number]
): string {
  return counts.join("-");
}

export function sortPatternKey(counts: [number, number, number, number]): string {
  return [...counts].sort((a, b) => b - a).join("-");
}
