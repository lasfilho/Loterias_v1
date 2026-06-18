import { GameType, PredictionStrategy } from "@prisma/client";

export type GameSlug = "lotofacil" | "megasena" | "quina";

export interface GameRules {
  slug: GameSlug;
  gameType: GameType;
  name: string;
  shortName: string;
  minNumber: number;
  maxNumber: number;
  drawCount: number;
  pickCount: number;
  color: string;
  gradient: string;
  apiSlug: string;
  description: string;
}

export const GAMES: Record<GameSlug, GameRules> = {
  lotofacil: {
    slug: "lotofacil",
    gameType: GameType.LOTOFACIL,
    name: "Lotofácil",
    shortName: "Lotofácil",
    minNumber: 1,
    maxNumber: 25,
    drawCount: 15,
    pickCount: 15,
    color: "#7c3aed",
    gradient: "from-violet-600 to-purple-500",
    apiSlug: "lotofacil",
    description: "15 dezenas sorteadas entre 25 números",
  },
  megasena: {
    slug: "megasena",
    gameType: GameType.MEGASENA,
    name: "Mega-Sena",
    shortName: "Mega-Sena",
    minNumber: 1,
    maxNumber: 60,
    drawCount: 6,
    pickCount: 6,
    color: "#16a34a",
    gradient: "from-emerald-600 to-green-500",
    apiSlug: "megasena",
    description: "6 dezenas sorteadas entre 60 números",
  },
  quina: {
    slug: "quina",
    gameType: GameType.QUINA,
    name: "Quina",
    shortName: "Quina",
    minNumber: 1,
    maxNumber: 80,
    drawCount: 5,
    pickCount: 5,
    color: "#2563eb",
    gradient: "from-blue-600 to-sky-500",
    apiSlug: "quina",
    description: "5 dezenas sorteadas entre 80 números",
  },
};

export const GAME_SLUGS = Object.keys(GAMES) as GameSlug[];

export const PREDICTION_STRATEGIES: {
  value: PredictionStrategy;
  label: string;
  description: string;
}[] = [
  {
    value: PredictionStrategy.FREQUENCY_WEIGHTED,
    label: "Frequência Ponderada",
    description: "Prioriza números com maior frequência histórica",
  },
  {
    value: PredictionStrategy.DELAY_BALANCED,
    label: "Atraso Balanceado",
    description: "Equilibra números atrasados com os mais frequentes",
  },
  {
    value: PredictionStrategy.HOT_COLD_MIX,
    label: "Quentes + Frios",
    description: "Mistura números em alta com números em baixa recente",
  },
  {
    value: PredictionStrategy.PATTERN_AWARE,
    label: "Padrões Estatísticos",
    description: "Respeita distribuição par/ímpar e faixas numéricas",
  },
  {
    value: PredictionStrategy.HYBRID,
    label: "Híbrido",
    description: "Combina todas as estratégias com pesos configuráveis",
  },
];

export const DISCLAIMER =
  "Análises baseadas em dados históricos e modelos probabilísticos. Não constitui garantia de resultado ou previsão.";

export function isGameSlug(value: string): value is GameSlug {
  return value in GAMES;
}

export function getGameRules(slug: GameSlug): GameRules {
  return GAMES[slug];
}
