import type { GameSlug } from "@/modules/shared/constants";
import {
  DAY_COLUMN_MIN_CLASS,
  WEEK_DAYS_ROW_CLASS,
} from "@/modules/shared/weekly-bet/constants";

export type VolanteGridSize = "compact" | "medium" | "comfortable";

/** Largura fixa do cartão Lotofácil em listas — não encolhe; quebra para a linha seguinte */
export const LOTOFACIL_LIST_CARD_CLASS = "w-[124px] sm:w-[136px] shrink-0 grow-0";

/** Mega/Quina: uma grade por linha, largura contida */
export const WIDE_VOLANTE_MAX_CLASS = "w-full max-w-[260px] sm:max-w-[280px]";

export function isWideVolanteGame(game: GameSlug): boolean {
  return game === "megasena" || game === "quina";
}

export function getVolanteGridSize(_game: GameSlug): VolanteGridSize {
  return "compact";
}

export function getVolanteListContainerClass(game: GameSlug): string {
  return isWideVolanteGame(game)
    ? "flex flex-col gap-2 w-full"
    : "flex flex-wrap gap-2 content-start";
}

export function getVolanteListItemClass(game: GameSlug): string {
  return isWideVolanteGame(game) ? WIDE_VOLANTE_MAX_CLASS : LOTOFACIL_LIST_CARD_CLASS;
}

export function getConferenceBoardClass(game: GameSlug): string {
  return isWideVolanteGame(game)
    ? `flex flex-col gap-2 w-full ${WIDE_VOLANTE_MAX_CLASS}`
    : WEEK_DAYS_ROW_CLASS;
}

export function getConferenceDayClass(game: GameSlug): string {
  return isWideVolanteGame(game) ? "w-full" : DAY_COLUMN_MIN_CLASS;
}
