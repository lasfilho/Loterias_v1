import { type DrawFilter } from "../../types";
import { type DrawRecord } from "../../repository/base-repository";

export function sortDrawsDesc(draws: DrawRecord[]): DrawRecord[] {
  return [...draws].sort((a, b) => b.contestNumber - a.contestNumber);
}

export function filterDraws(
  draws: DrawRecord[],
  filter?: DrawFilter
): DrawRecord[] {
  let result = sortDrawsDesc(draws);

  if (filter?.fromContest) {
    result = result.filter((d) => d.contestNumber >= filter.fromContest!);
  }
  if (filter?.toContest) {
    result = result.filter((d) => d.contestNumber <= filter.toContest!);
  }
  if (filter?.fromDate) {
    result = result.filter((d) => d.drawDate >= filter.fromDate!);
  }
  if (filter?.toDate) {
    result = result.filter((d) => d.drawDate <= filter.toDate!);
  }
  if (filter?.limit) {
    result = result.slice(0, filter.limit);
  }

  return result;
}

export function drawSums(draws: DrawRecord[]): number[] {
  return draws.map((d) => d.numbers.reduce((a, b) => a + b, 0));
}

export function countRepeatsWithPrevious(draws: DrawRecord[]): Array<{
  contestNumber: number;
  repeatCount: number;
}> {
  const sorted = sortDrawsDesc(draws);
  const result: Array<{ contestNumber: number; repeatCount: number }> = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = new Set(sorted[i].numbers);
    const previous = sorted[i + 1].numbers;
    const repeatCount = previous.filter((n) => current.has(n)).length;
    result.push({ contestNumber: sorted[i].contestNumber, repeatCount });
  }

  return result;
}
