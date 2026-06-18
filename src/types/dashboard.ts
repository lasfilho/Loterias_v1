import type { GameSlug } from "@/modules/shared/constants";
import type { FullAnalyticsReport } from "@/modules/shared/analytics/types";

export interface DashboardFilters {
  fromContest?: number;
  toContest?: number;
  limit?: number;
}

export interface DrawRow {
  id: string;
  contestNumber: number;
  drawDate: string;
  numbers: number[];
  accumulated?: boolean;
}

export interface DashboardGameContext {
  slug: GameSlug;
  name: string;
  shortName: string;
  color: string;
  pickCount: number;
  universeSize: number;
}

export type AnalyticsTab =
  | "overview"
  | "distribution"
  | "patterns"
  | "history"
  | "predictions"
  | "backtest";

export interface ApiError {
  message: string;
  status?: number;
}

export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: ApiError };

export interface DashboardSnapshot {
  analytics: FullAnalyticsReport;
  draws: DrawRow[];
}
