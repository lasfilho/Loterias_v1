import type { ConferenceDrawStatus } from "./types";

export function getCheckStatusMessage(status: ConferenceDrawStatus): string {
  switch (status) {
    case "awaiting":
      return "Sorteio ainda não publicado pela Caixa";
    case "future":
      return "Sorteio ainda não realizado";
    case "not_found":
      return "Sem resultado oficial (feriado ou sincronize novamente)";
    case "unassigned":
      return "Escolha um jogo salvo";
    default:
      return "";
  }
}

export function getCheckStatusShortLabel(status: ConferenceDrawStatus): string {
  switch (status) {
    case "awaiting":
      return "Aguardando Caixa";
    case "future":
      return "Futuro";
    case "not_found":
      return "Sem resultado";
    case "checked":
      return "Conferido";
    case "unassigned":
      return "Vazio";
    default:
      return "";
  }
}
