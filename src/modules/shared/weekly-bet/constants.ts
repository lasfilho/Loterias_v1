import type { GameSlug } from "../constants";

/** JS getDay(): 0=dom … 6=sáb */
export const DRAW_WEEKDAYS: Record<GameSlug, number[]> = {
  lotofacil: [6, 1, 2, 3, 4, 5],
  megasena: [6, 2, 4],
  quina: [6, 1, 2, 3, 4, 5],
};

export const WEEKDAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

export const WEEKDAY_SHORT: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

/** Dias desde o sábado-base até cada dia de sorteio */
export const WEEKDAY_OFFSET_FROM_SATURDAY: Record<number, number> = {
  6: 0,
  0: 1,
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
};

export const MAX_BETS_PER_WEEK: Partial<Record<GameSlug, number>> = {
  lotofacil: 2,
  megasena: 1,
  quina: 1,
};

export const DEFAULT_BET_COUNT: Record<GameSlug, number> = {
  lotofacil: 1,
  megasena: 1,
  quina: 1,
};

export const MAX_BET_COUNT = 5;

/** Largura mínima das colunas de dia (timeline + cartões) */
export const DAY_COLUMN_MIN_CLASS = "flex-1 min-w-[72px]";
export const WEEK_DAYS_ROW_CLASS = "flex gap-2 w-full";
