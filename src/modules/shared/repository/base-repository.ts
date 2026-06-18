import { type GameRules } from "../constants";
import { type DrawFilter, type NormalizedDraw } from "../types";
import { type LoadDrawInput } from "../etl/types";

export interface DrawRecord {
  contestNumber: number;
  drawDate: Date;
  numbers: number[];
  accumulated: boolean;
  prizePool?: number | null;
  winnersCount?: number | null;
  nextEstimate?: number | null;
}

export interface GameRepository {
  count(): Promise<number>;
  getLatestContest(): Promise<number | null>;
  contestExists(contestNumber: number): Promise<boolean>;
  findMany(filter?: DrawFilter): Promise<DrawRecord[]>;
  upsert(draw: NormalizedDraw): Promise<void>;
  upsertWithContext(input: LoadDrawInput): Promise<"created" | "updated">;
  upsertMany(draws: NormalizedDraw[]): Promise<number>;
}

export function validateDraw(rules: GameRules, numbers: number[]): boolean {
  if (numbers.length !== rules.drawCount) return false;
  const unique = new Set(numbers);
  if (unique.size !== numbers.length) return false;
  return numbers.every(
    (n) => n >= rules.minNumber && n <= rules.maxNumber
  );
}

export function getAllNumbers(rules: GameRules): number[] {
  return Array.from(
    { length: rules.maxNumber - rules.minNumber + 1 },
    (_, i) => i + rules.minNumber
  );
}
