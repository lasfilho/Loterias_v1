"use client";

import type { ReactNode } from "react";
import { CompactVolanteCard } from "@/components/domain/compact-volante-card";
import type { GameSlug } from "@/modules/shared/constants";
import { cn } from "@/lib/utils";

interface PredictionVolanteCardProps {
  game: GameSlug;
  numbers: number[];
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  className?: string;
}

/** Palpite salvo ou gerado — mesmo padrão visual dos cartões da conferência. */
export function PredictionVolanteCard({
  game,
  numbers,
  title,
  subtitle,
  headerActions,
  className,
}: PredictionVolanteCardProps) {
  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      {(title || headerActions) && (
        <div className="flex items-start justify-between gap-2 min-h-[1.25rem]">
          {title ? (
            <p className="text-[10px] font-semibold text-foreground leading-tight">
              {title}
            </p>
          ) : (
            <span />
          )}
          {headerActions && (
            <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      )}

      <CompactVolanteCard game={game} selectedNumbers={numbers} />

      {subtitle && (
        <p className="text-[9px] text-muted-foreground text-center leading-snug px-0.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}
