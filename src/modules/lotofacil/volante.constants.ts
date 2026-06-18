/**
 * Volante Lotofácil — grade 5×5 (dezenas 01 a 25).
 *
 * Layout oficial (linhas × colunas):
 *   01 02 03 04 05
 *   06 07 08 09 10
 *   11 12 13 14 15
 *   16 17 18 19 20
 *   21 22 23 24 25
 *
 * Moldura: 16 dezenas da borda externa.
 * Centro:  9 dezenas do miolo interno (3×3).
 */

export const LOTOFACIL_GRID_SIZE = 5;

/** Faixa estatisticamente mais frequente por concurso (15 dezenas sorteadas). */
export const LOTOFACIL_FRAME_CORE_BALANCE = {
  frameMin: 9,
  frameMax: 10,
  coreMin: 5,
  coreMax: 6,
} as const;

export const LOTOFACIL_FRAME_NUMBERS: readonly number[] = [
  1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25,
];

export const LOTOFACIL_CORE_NUMBERS: readonly number[] = [
  7, 8, 9, 12, 13, 14, 17, 18, 19,
];

const FRAME_SET = new Set(LOTOFACIL_FRAME_NUMBERS);

export function lotofacilToGridPosition(number: number): {
  line: number;
  column: number;
} {
  const idx = number - 1;
  return {
    line: Math.floor(idx / LOTOFACIL_GRID_SIZE) + 1,
    column: (idx % LOTOFACIL_GRID_SIZE) + 1,
  };
}

export function isLotofacilFrameNumber(number: number): boolean {
  return FRAME_SET.has(number);
}

export function isLotofacilFrameCell(line: number, column: number): boolean {
  return (
    line === 1 ||
    line === LOTOFACIL_GRID_SIZE ||
    column === 1 ||
    column === LOTOFACIL_GRID_SIZE
  );
}

export function countLotofacilFrameCore(numbers: number[]): {
  frameCount: number;
  coreCount: number;
} {
  let frameCount = 0;
  let coreCount = 0;
  for (const n of numbers) {
    if (isLotofacilFrameNumber(n)) frameCount++;
    else coreCount++;
  }
  return { frameCount, coreCount };
}

export function isBalancedFrameCoreSplit(
  frameCount: number,
  coreCount: number
): boolean {
  const { frameMin, frameMax, coreMin, coreMax } = LOTOFACIL_FRAME_CORE_BALANCE;
  return (
    frameCount >= frameMin &&
    frameCount <= frameMax &&
    coreCount >= coreMin &&
    coreCount <= coreMax
  );
}
