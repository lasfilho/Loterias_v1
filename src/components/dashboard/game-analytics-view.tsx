"use client";

import { useState } from "react";
import {
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import type { GameSlug } from "@/modules/shared/constants";
import { GAMES } from "@/modules/shared/constants";
import { useAnalytics } from "@/hooks/use-analytics";
import { useDraws } from "@/hooks/use-draws";
import { useDashboardFilters } from "@/hooks/use-dashboard-filters";
import { DashboardFiltersPanel } from "@/components/dashboard/dashboard-filters";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ErrorState } from "@/components/dashboard/error-state";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import { MethodologyAccordion } from "@/components/dashboard/methodology-accordion";
import { InfoBlock } from "@/components/dashboard/info-block";
import {
  DistributionTab,
  OverviewTab,
  PatternsTab,
} from "@/components/dashboard/game-analytics-tabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

interface GameAnalyticsViewProps {
  slug: GameSlug;
  showMethodology?: boolean;
  className?: string;
}

export function GameAnalyticsView({
  slug,
  showMethodology = true,
  className,
}: GameAnalyticsViewProps) {
  const rules = GAMES[slug];
  const [filtersOpen, setFiltersOpen] = useState(true);
  const { filters, draft, setDraft, apply, reset, activeCount } =
    useDashboardFilters();
  const { data: analytics, loading, error, reload } = useAnalytics(
    slug,
    filters
  );
  const { data: draws } = useDraws(slug, filters, 25);

  if (loading && !analytics) {
    return <DashboardSkeleton />;
  }

  if (error && !analytics) {
    return <ErrorState message={error} onRetry={reload} className="mt-8" />;
  }

  const hasData = analytics && analytics.totalDraws > 0;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {hasData ? (
            <>
              <span className="font-medium text-foreground">{rules.name}</span>
              {" · "}
              {analytics.totalDraws.toLocaleString("pt-BR")} concursos
              {analytics.lastContest != null && (
                <> · último #{analytics.lastContest}</>
              )}
              {analytics.lastDrawDate && (
                <> · {formatDate(analytics.lastDrawDate)}</>
              )}
            </>
          ) : (
            <>Selecione filtros ou importe concursos para analisar.</>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          {filtersOpen ? (
            <>
              <PanelRightClose className="h-4 w-4" />
              Ocultar filtros
            </>
          ) : (
            <>
              <PanelRightOpen className="h-4 w-4" />
              Mostrar filtros
            </>
          )}
        </Button>
      </div>

      <InfoBlock variant="accent">
        Indicadores derivados de dados históricos. Não representam probabilidade
        oficial nem garantia de acerto em sorteios futuros.
      </InfoBlock>

      <div
        className={cn(
          "grid gap-6",
          filtersOpen && "xl:grid-cols-[1fr_280px]"
        )}
      >
        <div className="space-y-8 min-w-0">
          {!hasData ? (
            <EmptyState
              title="Sem dados para análise"
              description={`Importe o histórico de concursos da ${rules.name} para visualizar KPIs, gráficos e padrões.`}
              actionLabel="Importar concursos"
              actionHref="/importacao"
              icon="database"
            />
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="overview">Visão geral</TabsTrigger>
                <TabsTrigger value="distribution">Distribuição</TabsTrigger>
                <TabsTrigger value="patterns">Padrões</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <OverviewTab analytics={analytics} rules={rules} draws={draws} />
              </TabsContent>
              <TabsContent value="distribution">
                <DistributionTab analytics={analytics} color={rules.color} />
              </TabsContent>
              <TabsContent value="patterns">
                <PatternsTab
                  analytics={analytics}
                  color={rules.color}
                  slug={slug}
                />
              </TabsContent>
            </Tabs>
          )}

          {showMethodology && <MethodologyAccordion />}
        </div>

        {filtersOpen && (
          <DashboardFiltersPanel
            draft={draft}
            setDraft={setDraft}
            onApply={apply}
            onReset={reset}
            activeCount={activeCount}
            accent={rules.color}
            onCollapse={() => setFiltersOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
