"use client";

import { cn } from "@/lib/utils";
import { LOTOFACIL_GRID_SIZE } from "@/modules/lotofacil/volante.constants";
import {
  getVolanteCellPresentationForGame,
  getVolanteCellTextSize,
  VOLANTE_GRID_SHELL,
  type VolanteCellState,
} from "@/lib/volante-cell-styles";
import type { GameSlug } from "@/modules/shared/constants";

export type NumberCellState = VolanteCellState;

function cellState(
  n: number,
  betNumbers: number[],
  drawNumbers: number[]
): NumberCellState {
  const inBet = betNumbers.includes(n);
  const inDraw = drawNumbers.includes(n);
  if (inBet && inDraw) return "match";
  if (inBet) return "bet";
  if (inDraw) return "draw";
  return "neutral";
}

interface ComparisonNumberGridProps {
  minNumber: number;
  maxNumber: number;
  betNumbers: number[];
  drawNumbers: number[];
  game?: GameSlug;
  columns?: number;
  size?: "default" | "compact";
  className?: string;
  animateReveal?: boolean;
}

export function ComparisonNumberGrid({
  minNumber,
  maxNumber,
  betNumbers,
  drawNumbers,
  game,
  columns,
  size = "default",
  className,
  animateReveal = false,
}: ComparisonNumberGridProps) {
  const cells = Array.from(
    { length: maxNumber - minNumber + 1 },
    (_, i) => minNumber + i
  );

  const gridCols =
    columns ??
    (maxNumber <= 25 ? LOTOFACIL_GRID_SIZE : maxNumber <= 60 ? 10 : 10);

  const textSize = getVolanteCellTextSize(
    game ?? "lotofacil",
    size === "compact" ? "compact" : "comfortable"
  );

  return (
    <div
      className={cn(VOLANTE_GRID_SHELL, className)}
      style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
    >
      {cells.map((n, i) => {
        const state = cellState(n, betNumbers, drawNumbers);
        const presentation = getVolanteCellPresentationForGame(
          state,
          game ?? "lotofacil"
        );

        return (
          <div
            key={n}
            className={cn(
              presentation.className,
              textSize,
              "transition-all duration-300",
              animateReveal && state === "match" && "animate-in zoom-in-50 duration-500",
              animateReveal && "fade-in slide-in-from-bottom-1"
            )}
            style={{
              ...presentation.style,
              ...(animateReveal ? { animationDelay: `${i * 8}ms` } : {}),
            }}
          >
            {String(n).padStart(2, "0")}
          </div>
        );
      })}
    </div>
  );
}

export function ComparisonLegend({
  className,
  game = "lotofacil",
}: {
  className?: string;
  game?: GameSlug;
}) {
  const items: { state: VolanteCellState; label: string }[] = [
    { state: "bet", label: "Seu jogo" },
    { state: "draw", label: "Sorteado" },
    { state: "match", label: "Acerto" },
    { state: "neutral", label: "Outros" },
  ];

  return (
    <div className={cn("flex flex-wrap gap-3 text-[11px]", className)}>
      {items.map(({ state, label }) => {
        const presentation = getVolanteCellPresentationForGame(state, game);
        return (
          <span key={state} className="flex items-center gap-1.5">
            <span
              className={cn("h-3.5 w-3.5 rounded-sm border", presentation.className)}
              style={presentation.style}
            />
            {label}
          </span>
        );
      })}
    </div>
  );
}
