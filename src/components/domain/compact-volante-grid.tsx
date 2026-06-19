"use client";

import { GAMES, type GameSlug } from "@/modules/shared/constants";
import { LOTOFACIL_GRID_SIZE } from "@/modules/lotofacil/volante.constants";
import { getVolanteGridSize } from "@/components/domain/volante-layout";
import {
  getVolanteCellPresentationForGame,
  getVolanteCellTextSize,
  VOLANTE_GRID_SHELL,
  type VolanteCellState,
} from "@/lib/volante-cell-styles";
import { cn } from "@/lib/utils";

interface CompactVolanteGridProps {
  game: GameSlug;
  selectedNumbers?: number[];
  matchedNumbers?: number[];
  drawNumbers?: number[];
  size?: "compact" | "medium" | "comfortable";
  className?: string;
}

function cellState(
  n: number,
  selected: Set<number>,
  matched: Set<number>,
  drawn: Set<number>
): VolanteCellState {
  const inBet = selected.has(n);
  const inDraw = drawn.has(n);
  if (inBet && matched.has(n)) return "match";
  if (inBet) return "bet";
  if (inDraw) return "draw";
  return "neutral";
}

export function CompactVolanteGrid({
  game,
  selectedNumbers = [],
  matchedNumbers = [],
  drawNumbers = [],
  size: sizeProp,
  className,
}: CompactVolanteGridProps) {
  const rules = GAMES[game];
  const size = sizeProp ?? getVolanteGridSize(game);
  const selected = new Set(selectedNumbers);
  const matched = new Set(matchedNumbers);
  const drawn = new Set(drawNumbers);

  const cols =
    game === "lotofacil" ? LOTOFACIL_GRID_SIZE : game === "megasena" ? 10 : 10;

  const cells = Array.from(
    { length: rules.maxNumber - rules.minNumber + 1 },
    (_, i) => rules.minNumber + i
  );

  const textSize = getVolanteCellTextSize(game, size);

  return (
    <div className={cn("w-full", className)}>
      <div
        className={VOLANTE_GRID_SHELL}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cells.map((n) => {
          const state = cellState(n, selected, matched, drawn);
          const presentation = getVolanteCellPresentationForGame(state, game);

          return (
            <div
              key={n}
              className={cn(presentation.className, textSize)}
              style={presentation.style}
            >
              {game === "lotofacil" ? n : String(n).padStart(2, "0")}
            </div>
          );
        })}
      </div>
    </div>
  );
}
