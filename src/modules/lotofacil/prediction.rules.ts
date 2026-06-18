/** Regras heurísticas específicas Lotofácil (volante 5×5) */
export function validateLotofacilCombination(numbers: number[]): {
  lineBalance: Record<number, number>;
  columnBalance: Record<number, number>;
  note: string;
} {
  const lineBalance: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const columnBalance: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  numbers.forEach((n) => {
    const idx = n - 1;
    const line = Math.floor(idx / 5) + 1;
    const col = (idx % 5) + 1;
    lineBalance[line]++;
    columnBalance[col]++;
  });

  return {
    lineBalance,
    columnBalance,
    note: "Distribuição por linhas/colunas do volante 5×5 (informativo)",
  };
}
