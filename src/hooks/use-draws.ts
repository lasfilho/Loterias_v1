"use client";

import { useCallback, useEffect, useState } from "react";
import type { GameSlug } from "@/modules/shared/constants";
import { fetchDraws } from "@/lib/api-client";
import type { DashboardFilters, DrawRow } from "@/types/dashboard";

export function useDraws(game: GameSlug, filters: DashboardFilters, limit = 30) {
  const [data, setData] = useState<DrawRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const draws = await fetchDraws(game, { ...filters, limit });
      setData(
        draws.map((d) => ({
          ...d,
          drawDate:
            typeof d.drawDate === "string"
              ? d.drawDate
              : new Date(d.drawDate).toISOString(),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar histórico");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [game, filters, limit]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
