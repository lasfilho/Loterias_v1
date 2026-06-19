import type { GameSlug } from "@/modules/shared/constants";

export interface GameTheme {
  /** Botões outline (Gerar, Salvar, Conferir…) */
  outlineButton: string;
  /** Hover/focus nos slots da grade semanal */
  slotHover: string;
  /** Hover nos itens do modal de escolha */
  pickerItemHover: string;
  /** Fundo do painel do volante (Mega/Quina) */
  volantePanelBg: string;
  /** Dezenas do palpite no cartão */
  betCell: string;
  /** Acertos (palpite + sorteio) */
  matchCell: string;
  /** Sorteado sem estar no palpite */
  drawCell: string;
  /** Texto de acertos no slot compacto */
  prizeHits: string;
  /** Cor hex para barras/gradientes */
  accent: string;
  /** Fundo suave do painel de comparação */
  comparisonPanelBg: string;
  /** Select de modalidade — borda e foco por jogo */
  selectField: string;
}

export const GAME_THEMES: Record<GameSlug, GameTheme> = {
  lotofacil: {
    outlineButton:
      "gap-2 border border-violet-300/70 bg-transparent text-violet-600 dark:text-violet-200 shadow-none hover:bg-violet-400 hover:text-white hover:border-violet-400 active:bg-violet-500/90 active:scale-[0.98] transition-all",
    slotHover:
      "hover:ring-2 hover:ring-violet-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60",
    pickerItemHover: "hover:border-violet-300/60 hover:bg-violet-300/10",
    volantePanelBg: "bg-violet-50/60 dark:bg-violet-950/20",
    betCell:
      "bg-violet-300/95 text-violet-950 border-violet-200 dark:bg-violet-400/85 dark:text-violet-950 dark:border-violet-300/60",
    matchCell:
      "bg-violet-200 text-violet-900 border-violet-300/80 ring-1 ring-violet-200/80 dark:bg-violet-300/90 dark:text-violet-950",
    drawCell:
      "bg-amber-200/90 text-amber-900 border-amber-300/70 dark:bg-amber-400/70 dark:text-amber-950",
    prizeHits: "text-violet-500 dark:text-violet-300",
    accent: "#c4b5fd",
    comparisonPanelBg: "bg-violet-300/8 border-violet-300/25",
    selectField:
      "border-violet-300/80 focus-visible:border-violet-400 focus-visible:ring-violet-300/40",
  },
  megasena: {
    outlineButton:
      "gap-2 border border-emerald-300/70 bg-transparent text-emerald-600 dark:text-emerald-200 shadow-none hover:bg-emerald-400 hover:text-white hover:border-emerald-400 active:bg-emerald-500/90 active:scale-[0.98] transition-all",
    slotHover:
      "hover:ring-2 hover:ring-emerald-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60",
    pickerItemHover: "hover:border-emerald-300/60 hover:bg-emerald-300/10",
    volantePanelBg: "bg-emerald-50/60 dark:bg-emerald-950/15",
    betCell:
      "bg-emerald-300/95 text-emerald-950 border-emerald-200 dark:bg-emerald-400/85 dark:text-emerald-950 dark:border-emerald-300/60",
    matchCell:
      "bg-emerald-200 text-emerald-900 border-emerald-300/80 ring-1 ring-emerald-200/80 dark:bg-emerald-300/90 dark:text-emerald-950",
    drawCell:
      "bg-amber-200/90 text-amber-900 border-amber-300/70 dark:bg-amber-400/70 dark:text-amber-950",
    prizeHits: "text-emerald-500 dark:text-emerald-300",
    accent: "#86efac",
    comparisonPanelBg: "bg-emerald-300/8 border-emerald-300/25",
    selectField:
      "border-emerald-300/80 focus-visible:border-emerald-400 focus-visible:ring-emerald-300/40",
  },
  quina: {
    outlineButton:
      "gap-2 border border-sky-300/70 bg-transparent text-sky-600 dark:text-sky-200 shadow-none hover:bg-sky-400 hover:text-white hover:border-sky-400 active:bg-sky-500/90 active:scale-[0.98] transition-all",
    slotHover:
      "hover:ring-2 hover:ring-sky-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60",
    pickerItemHover: "hover:border-sky-300/60 hover:bg-sky-300/10",
    volantePanelBg: "bg-sky-50/60 dark:bg-sky-950/15",
    betCell:
      "bg-sky-300/95 text-sky-950 border-sky-200 dark:bg-sky-400/85 dark:text-sky-950 dark:border-sky-300/60",
    matchCell:
      "bg-sky-200 text-sky-900 border-sky-300/80 ring-1 ring-sky-200/80 dark:bg-sky-300/90 dark:text-sky-950",
    drawCell:
      "bg-amber-200/90 text-amber-900 border-amber-300/70 dark:bg-amber-400/70 dark:text-amber-950",
    prizeHits: "text-sky-500 dark:text-sky-300",
    accent: "#7dd3fc",
    comparisonPanelBg: "bg-sky-300/8 border-sky-300/25",
    selectField:
      "border-sky-300/80 focus-visible:border-sky-400 focus-visible:ring-sky-300/40",
  },
};

export function getGameTheme(game: GameSlug): GameTheme {
  return GAME_THEMES[game];
}
