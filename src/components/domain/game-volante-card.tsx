"use client";

import { LotofacilVolanteCard } from "@/components/domain/lotofacil-volante-card";
import { GAMES, type GameSlug } from "@/modules/shared/constants";
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

      <div
        className={cn("p-4 relative", game === "megasena" ? "bg-emerald-50/80 dark:bg-emerald-950/20" : "bg-sky-50/80 dark:bg-sky-950/20")}
      >
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {cells.map((n) => {
            const isSelected = selected.has(n);
            const isMatch = matched.has(n);
            const isDrawOnly = !isSelected && drawn.has(n);

            return (
              <div
                key={n}
                className={cn(
                  "aspect-square rounded-sm flex items-center justify-center text-[10px] font-bold tabular-nums border",
                  isMatch
                    ? "bg-emerald-500 text-white border-emerald-600"
                    : isSelected
                      ? "text-white border-transparent"
                      : isDrawOnly
                        ? "bg-orange-500/90 text-white border-orange-600"
                        : "bg-white/80 text-gray-500 border-border/60 dark:bg-muted/30"
                )}
                style={
                  isSelected && !isMatch
                    ? { backgroundColor: rules.color }
                    : undefined
                }
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
