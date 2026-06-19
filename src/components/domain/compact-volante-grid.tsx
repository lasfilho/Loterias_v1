"use client";

import { GAMES, type GameSlug } from "@/modules/shared/constants";
import { LOTOFACIL_GRID_SIZE } from "@/modules/lotofacil/volante.constants";
import { cn } from "@/lib/utils";

interface CompactVolanteGridProps {
  game: GameSlug;
  selectedNumbers?: number[];
  matchedNumbers?: number[];
  drawNumbers?: number[];
  className?: string;
}

function cellState(
  n: number,
  selected: Set<number>,
  matched: Set<number>,
  drawn: Set<number>
) {
  const inBet = selected.has(n);
  const inDraw = drawn.has(n);
  if (inBet && matched.has(n)) return "match";
  if (inBet) return "bet";
  if (inDraw) return "draw";
  return "neutral";
}

const CELL: Record<string, string> = {
  neutral: "bg-card text-muted-foreground border-border/80",
  bet: "bg-orange-500 text-white border-orange-600 dark:bg-orange-600 dark:border-orange-500",
  draw: "bg-amber-400/80 text-amber-950 border-amber-500 dark:bg-amber-500 dark:text-white",
  match: "bg-emerald-500 text-white border-emerald-600 ring-1 ring-emerald-400/60",
};

export function CompactVolanteGrid({
  game,
  selectedNumbers = [],
  matchedNumbers = [],
  drawNumbers = [],
  className,
}: CompactVolanteGridProps) {
  const rules = GAMES[game];
  const selected = new Set(selectedNumbers);
  const matched = new Set(matchedNumbers);
  const drawn = new Set(drawNumbers);

  const cols =
    game === "lotofacil" ? LOTOFACIL_GRID_SIZE : game === "megasena" ? 10 : 10;

  const cells = Array.from(
    { length: rules.maxNumber - rules.minNumber + 1 },
    (_, i) => rules.minNumber + i
  );

  return (
    <div className={cn("w-full", className)}>
      <div
        className="grid gap-px bg-border/60 rounded-sm overflow-hidden border border-border/60 w-full"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cells.map((n) => {
          const state = cellState(n, selected, matched, drawn);
          return (
            <div
              key={n}
              className={cn(
                "aspect-square flex items-center justify-center font-bold tabular-nums border",
                game === "lotofacil" ? "text-[9px] sm:text-[10px]" : "text-[7px] sm:text-[8px]",
                CELL[state]
              )}
            >
              {game === "lotofacil" ? n : String(n).padStart(2, "0")}
            </div>
          );
        })}
      </div>
    </div>
  );
}
