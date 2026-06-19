import type { GameSlug } from "../constants";

export type ConferenceDrawStatus =
  | "unassigned"
  | "future"
  | "awaiting"
  | "checked"
  | "not_found";

export interface SavedBetView {
  id: string;
  betSlot: number;
  numbers: number[];
  strategy: string;
  strategyDetail?: string;
  notes?: string | null;
  savedAt: string;
  hash?: string;
}

export interface ConferenceCheckView {
  predictionId: string | null;
  betSlot: number;
  betNumbers: number[];
  strategy: string;
  strategyDetail?: string;
  weekday: number;
  weekdayLabel: string;
  expectedDate: string;
  status: ConferenceDrawStatus;
  assigned: boolean;
  contestNumber?: number;
  drawDate?: string;
  drawNumbers: number[];
  matchedNumbers: number[];
  hits: number | null;
  prizeBand: string | null;
  isPrizeEligible: boolean;
}

export interface ConferenceDayView {
  weekday: number;
  weekdayLabel: string;
  expectedDate: string;
  checks: ConferenceCheckView[];
}

export interface ConferenceSummaryView {
  totalBets: number;
  totalSlots: number;
  assignedSlots: number;
  checkedSlots: number;
  awaitingSlots: number;
  futureSlots: number;
  notFoundSlots: number;
  maxHits: number;
  totalHits: number;
  prizeEligibleCount: number;
  bestBetLabel: string | null;
}

export interface ConferenceWeekView {
  game: GameSlug;
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  reviewed: boolean;
  betCount: number;
  bets: SavedBetView[];
  days: ConferenceDayView[];
  summary: ConferenceSummaryView;
}

export interface ConferenceSyncResult {
  game: GameSlug;
  weekStart: string;
  syncedContests: number;
  conference: ConferenceWeekView;
}
