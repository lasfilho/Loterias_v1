"use client";

import { useState } from "react";
import type { DashboardFilters } from "@/types/dashboard";

const DEFAULT_LIMIT = 500;

export function useDashboardFilters(initial?: DashboardFilters) {
  const [filters, setFilters] = useState<DashboardFilters>({
    limit: initial?.limit ?? DEFAULT_LIMIT,
    fromContest: initial?.fromContest,
    toContest: initial?.toContest,
  });
  const [draft, setDraft] = useState(filters);

  const apply = () => setFilters({ ...draft });
  const reset = () => {
    const clean = { limit: DEFAULT_LIMIT };
    setDraft(clean);
    setFilters(clean);
  };

  return {
    filters,
    draft,
    setDraft,
    apply,
    reset,
    activeCount: [draft.fromContest, draft.toContest].filter(Boolean).length,
  };
}
