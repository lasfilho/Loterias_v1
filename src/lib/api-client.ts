import type { GameSlug } from "@/modules/shared/constants";
import type { DashboardFilters } from "@/types/dashboard";
import type { FullAnalyticsReport } from "@/modules/shared/analytics/types";
import type { GenerationMode } from "@/modules/shared/prediction/types";

function buildQuery(filter?: DashboardFilters): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.fromContest) params.set("fromContest", String(filter.fromContest));
  if (filter.toContest) params.set("toContest", String(filter.toContest));
  if (filter.limit) params.set("limit", String(filter.limit));
  const q = params.toString();
  return q ? `?${q}` : "";
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchAnalytics(
  game: GameSlug,
  filter?: DashboardFilters
): Promise<FullAnalyticsReport> {
  const res = await fetch(`/api/games/${game}/analytics${buildQuery(filter)}`, {
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function fetchDraws(
  game: GameSlug,
  filter?: DashboardFilters & { limit?: number }
) {
  const res = await fetch(
    `/api/games/${game}/draws${buildQuery({ ...filter, limit: filter?.limit ?? 30 })}`,
    { cache: "no-store" }
  );
  return handleResponse<
    Array<{
      id: string;
      contestNumber: number;
      drawDate: string;
      numbers: number[];
      accumulated?: boolean;
    }>
  >(res);
}

export async function fetchDashboardStats() {
  const res = await fetch("/api/dashboard", { cache: "no-store" });
  return handleResponse<
    Array<{
      slug: GameSlug;
      name: string;
      shortName?: string;
      color: string;
      totalDraws: number;
      latestContest: number | null;
      lastDrawDate: string | null;
    }>
  >(res);
}

export async function generatePredictionApi(
  game: GameSlug,
  body: Record<string, unknown>
) {
  const res = await fetch(`/api/games/${game}/predictions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function compareStrategiesApi(
  game: GameSlug,
  mode?: GenerationMode
) {
  const res = await fetch(`/api/games/${game}/predictions/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
  return handleResponse(res);
}

export async function fetchPredictionHistory(game: GameSlug, limit = 10) {
  const res = await fetch(
    `/api/games/${game}/predictions/history?limit=${limit}`,
    { cache: "no-store" }
  );
  return handleResponse<{ predictions: Array<Record<string, unknown>> }>(res);
}
