"use client";

import type { ReactNode } from "react";
import { CompactVolanteGrid } from "@/components/domain/compact-volante-grid";
import type { GameSlug } from "@/modules/shared/constants";
import { getGameTheme } from "@/lib/game-theme";
import { cn } from "@/lib/utils";

interface CompactVolanteCardProps {
  game: GameSlug;
  selectedNumbers?: number[];
  matchedNumbers?: number[];
  drawNumbers?: number[];
  label?: ReactNode;
  footer?: ReactNode;
  dashed?: boolean;
  interactive?: boolean;
  className?: string;
  /** Atributo title nativo (tooltip) */
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
}

/** Cartão compacto no mesmo padrão da grade semanal de conferência. */
export function CompactVolanteCard({
  game,
  selectedNumbers = [],
  matchedNumbers = [],
  drawNumbers = [],
  label,
  footer,
  dashed = false,
  interactive = false,
  className,
  title,
  onClick,
  disabled,
}: CompactVolanteCardProps) {
  const theme = getGameTheme(game);
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "w-full rounded-lg border border-border/40 bg-transparent p-1.5 transition-all",
        interactive && theme.slotHover,
        dashed && "border-dashed",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {label && (
        <div className="text-[9px] text-center text-muted-foreground mb-1 font-medium">
          {label}
        </div>
      )}

      <CompactVolanteGrid
        game={game}
        selectedNumbers={selectedNumbers}
        matchedNumbers={matchedNumbers}
        drawNumbers={drawNumbers}
      />

      {footer}
    </Comp>
  );
}
