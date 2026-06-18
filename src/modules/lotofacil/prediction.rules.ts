import {
  countLotofacilFrameCore,
  isBalancedFrameCoreSplit,
  LOTOFACIL_FRAME_CORE_BALANCE,
  lotofacilToGridPosition,
} from "./volante.constants";

/** Regras heurísticas específicas Lotofácil (volante 5×5) */
export function validateLotofacilCombination(numbers: number[]): {
  lineBalance: Record<number, number>;
  columnBalance: Record<number, number>;
  frameCore: {
    frameCount: number;
    coreCount: number;
    isBalanced: boolean;
    expectedRange: typeof LOTOFACIL_FRAME_CORE_BALANCE;
    note: string;
  };
  note: string;
} {
  const lineBalance: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const columnBalance: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  numbers.forEach((n) => {
    const { line, column } = lotofacilToGridPosition(n);
    lineBalance[line]++;
    columnBalance[column]++;
  });

  const { frameCount, coreCount } = countLotofacilFrameCore(numbers);
  const isBalanced = isBalancedFrameCoreSplit(frameCount, coreCount);

  return {
    lineBalance,
    columnBalance,
    frameCore: {
      frameCount,
      coreCount,
      isBalanced,
      expectedRange: { ...LOTOFACIL_FRAME_CORE_BALANCE },
      note: isBalanced
        ? `Equilíbrio moldura/centro (${frameCount}×${coreCount}) dentro da faixa histórica 9–10 / 5–6`
        : `Fora da faixa típica: ${frameCount} moldura + ${coreCount} centro (esperado 9–10 / 5–6)`,
    },
    note: "Distribuição espacial do volante 5×5 (moldura × centro, linhas e colunas)",
  };
}
