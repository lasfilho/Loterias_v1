import type { CSSProperties } from "react";
import type { GameSlug } from "@/modules/shared/constants";
import { getGameTheme } from "@/lib/game-theme";

export type VolanteGridTextSize = "compact" | "medium" | "comfortable";

export type VolanteCellState = "neutral" | "bet" | "match" | "draw";

const DRAW_COLOR = "#f59e0b";

export interface VolanteCellPresentation {
  className: string;
  style?: CSSProperties;
}

const CELL_BASE =
  "aspect-square flex items-center justify-center font-extrabold tabular-nums border rounded-sm transition-colors leading-none";

const NEUTRAL_CELL =
  "bg-transparent text-muted-foreground border-border/40 dark:border-white/10 dark:bg-white/[0.03]";

/** Estilo de célula no padrão das bolinhas — fundo mesclado, não sólido. */
export function getVolanteCellPresentation(
  state: VolanteCellState,
  accent: string
): VolanteCellPresentation {
  switch (state) {
    case "bet":
      return {
        className: `${CELL_BASE} shadow-sm`,
        style: {
          background: `linear-gradient(135deg, ${accent}33, ${accent}14)`,
          borderColor: `${accent}48`,
          color: accent,
        },
      };
    case "match":
      return {
        className: `${CELL_BASE} shadow-sm scale-105 z-[1]`,
        style: {
          background: `linear-gradient(135deg, ${accent}ee, ${accent}bb)`,
          borderColor: accent,
          color: "#ffffff",
          boxShadow: `0 0 0 1px ${accent}44, 0 2px 6px ${accent}33`,
        },
      };
    case "draw":
      return {
        className: `${CELL_BASE} shadow-sm`,
        style: {
          background: `linear-gradient(135deg, ${DRAW_COLOR}30, ${DRAW_COLOR}12)`,
          borderColor: `${DRAW_COLOR}50`,
          color: "#b45309",
        },
      };
    default:
      return {
        className: `${CELL_BASE} ${NEUTRAL_CELL}`,
      };
  }
}

export function getVolanteCellPresentationForGame(
  state: VolanteCellState,
  game: GameSlug
): VolanteCellPresentation {
  return getVolanteCellPresentation(state, getGameTheme(game).accent);
}

export const VOLANTE_GRID_SHELL =
  "grid w-full rounded-md border border-border/35 bg-transparent p-1 gap-0.5";

/** Tamanho só do número — não altera a célula (aspect-square). */
export function getVolanteCellTextSize(
  game: GameSlug,
  size: VolanteGridTextSize = "compact"
): string {
  if (game === "lotofacil") {
    return size === "comfortable"
      ? "text-xs sm:text-sm"
      : "text-[11px] sm:text-xs";
  }
  if (size === "comfortable") return "text-[11px] sm:text-sm";
  if (size === "medium") return "text-[10px] sm:text-[11px]";
  return "text-[9px] sm:text-[10px]";
}
