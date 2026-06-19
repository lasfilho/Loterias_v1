"use client";

import { cn } from "@/lib/utils";
import { LOTOFACIL_GRID_SIZE } from "@/modules/lotofacil/volante.constants";

export type NumberCellState = "neutral" | "bet" | "draw" | "match";

const CELL_STYLES: Record<NumberCellState, string> = {
  neutral:
    "bg-muted/40 text-muted-foreground border-border/60 dark:bg-muted/20",
  bet: "bg-blue-500/90 text-white border-blue-600 shadow-sm shadow-blue-500/30",
  draw: "bg-orange-500/90 text-white border-orange-600 shadow-sm shadow-orange-500/30",
  match:
    "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/40 ring-2 ring-emerald-300/50 scale-105",
};

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

  const cellClass = size === "compact" ? "text-[10px]" : "text-xs";

  return (
    <div
      className={cn("grid gap-1 w-full", className)}
      style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
    >
      {cells.map((n, i) => {
        const state = cellState(n, betNumbers, drawNumbers);
        return (
          <div
            key={n}
            className={cn(
              "aspect-square rounded-md flex items-center justify-center font-bold tabular-nums border transition-all duration-300",
              cellClass,
              CELL_STYLES[state],
              animateReveal && state === "match" && "animate-in zoom-in-50 duration-500",
              animateReveal && "fade-in slide-in-from-bottom-1"
            )}
            style={animateReveal ? { animationDelay: `${i * 8}ms` } : undefined}
          >
            {String(n).padStart(2, "0")}
          </div>
        );
      })}
    </div>
  );
}

export function ComparisonLegend({ className }: { className?: string }) {
  const items: { state: NumberCellState; label: string }[] = [
    { state: "bet", label: "Seu jogo" },
    { state: "draw", label: "Sorteado" },
    { state: "match", label: "Acerto" },
    { state: "neutral", label: "Outros" },
  ];

  return (
    <div className={cn("flex flex-wrap gap-3 text-[11px]", className)}>
      {items.map(({ state, label }) => (
        <span key={state} className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-3 w-3 rounded-sm border",
              CELL_STYLES[state]
            )}
          />
          {label}
        </span>
      ))}
    </div>
  );
}
