"use client";

import { useCallback, useEffect, useState } from "react";
import type { GameSlug } from "@/modules/shared/constants";
import type { FullAnalyticsReport } from "@/modules/shared/analytics/types";
import { fetchAnalytics } from "@/lib/api-client";
import type { DashboardFilters } from "@/types/dashboard";

export function useAnalytics(game: GameSlug, filters: DashboardFilters) {
  const [data, setData] = useState<FullAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const report = await fetchAnalytics(game, filters);
      setData(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar análises");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [game, filters]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
