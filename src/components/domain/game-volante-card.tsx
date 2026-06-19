"use client";

import { LotofacilVolanteCard } from "@/components/domain/lotofacil-volante-card";
import { GAMES, type GameSlug } from "@/modules/shared/constants";
import {
  getVolanteCellPresentationForGame,
  getVolanteCellTextSize,
  VOLANTE_GRID_SHELL,
  type VolanteCellState,
} from "@/lib/volante-cell-styles";
import { cn } from "@/lib/utils";

interface GameVolanteCardProps {
  game: GameSlug;
  selectedNumbers?: number[];
  matchedNumbers?: number[];
  drawNumbers?: number[];
  size?: "default" | "compact";
  className?: string;
  emptyLabel?: string;
}

export function GameVolanteCard({
  game,
  selectedNumbers = [],
  matchedNumbers = [],
  drawNumbers = [],
  size = "compact",
  className,
  emptyLabel = "Toque para escolher jogo",
}: GameVolanteCardProps) {
  const rules = GAMES[game];
  const selected = new Set(selectedNumbers);
  const matched = new Set(matchedNumbers);
  const drawn = new Set(drawNumbers);
  const isEmpty = selectedNumbers.length === 0;

  if (game === "lotofacil") {
    return (
      <div className={cn("relative", className)}>
        <LotofacilVolanteCard
          selectedNumbers={selectedNumbers}
          color={rules.color}
          title={rules.shortName.toUpperCase()}
          size={size}
          showBalance={!isEmpty}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-[1px]">
            <p className="text-xs font-medium text-muted-foreground text-center px-4">
              {emptyLabel}
            </p>
          </div>
        )}
      </div>
    );
  }

  const cols = game === "megasena" ? 10 : 10;
  const cells = Array.from(
    { length: rules.maxNumber - rules.minNumber + 1 },
    (_, i) => rules.minNumber + i
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border shadow-sm",
        size === "compact" ? "max-w-[280px]" : "max-w-[320px]",
        className
      )}
    >
      <div
        className="px-3 py-2 text-center"
        style={{
          background: `linear-gradient(135deg, ${rules.color} 0%, ${rules.color}99 100%)`,
        }}
      >
        <span className="text-sm font-black italic tracking-wide text-white uppercase">
          {rules.shortName}
        </span>
      </div>

      <div className={cn("p-4 relative bg-transparent")}>
        <div
          className={VOLANTE_GRID_SHELL}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {cells.map((n) => {
            let state: VolanteCellState = "neutral";
            const isSelected = selected.has(n);
            const isMatch = matched.has(n);
            const isDrawOnly = !isSelected && drawn.has(n);
            if (isMatch) state = "match";
            else if (isSelected) state = "bet";
            else if (isDrawOnly) state = "draw";

            const presentation = getVolanteCellPresentationForGame(state, game);

            return (
              <div
                key={n}
                className={cn(
                  presentation.className,
                  getVolanteCellTextSize(game, "compact")
                )}
                style={presentation.style}
              >
                {String(n).padStart(2, "0")}
              </div>
            );
          })}
        </div>

        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
            <p className="text-xs font-medium text-muted-foreground text-center px-4">
              {emptyLabel}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
