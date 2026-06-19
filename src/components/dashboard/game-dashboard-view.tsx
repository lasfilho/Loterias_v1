"use client";

import { useState } from "react";
import {
  BarChart2,
  FlaskConical,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
} from "lucide-react";
import type { GameSlug } from "@/modules/shared/constants";
import { GAMES } from "@/modules/shared/constants";
import { useAnalytics } from "@/hooks/use-analytics";
import { useDraws } from "@/hooks/use-draws";
import { useDashboardFilters } from "@/hooks/use-dashboard-filters";
import { SectionShell } from "@/components/dashboard/section-shell";
import { DashboardFiltersPanel } from "@/components/dashboard/dashboard-filters";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ErrorState } from "@/components/dashboard/error-state";
import {
  DashboardSkeleton,
  TableSkeleton,
} from "@/components/dashboard/skeletons";
import { MethodologyAccordion } from "@/components/dashboard/methodology-accordion";
import { InfoBlock } from "@/components/dashboard/info-block";
import { DataTable } from "@/components/dashboard/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DistributionTab,
  OverviewTab,
  PatternsTab,
} from "@/components/dashboard/game-analytics-tabs";
import { formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DrawNumbers } from "@/components/domain/number-ball";
import { LotofacilVolanteCard } from "@/components/domain/lotofacil-volante-card";
import {
  GENERATION_MODES,
  GENERATION_STRATEGIES,
  type GenerationMode,
  type GenerationStrategy,
} from "@/modules/shared/prediction/types";
import {
  compareStrategiesApi,
  generatePredictionApi,
} from "@/lib/api-client";
import type { DrawRow } from "@/types/dashboard";
import Link from "next/link";
import { runBacktestApi } from "@/lib/api-client";
import type { BacktestReport } from "@/modules/shared/backtest/types";
import {
  StrategyRankingChart,
  ScoreCorrelationChart,
} from "@/components/charts/backtest-charts";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

interface GameDashboardViewProps {
  slug: GameSlug;
}

export function GameDashboardView({ slug }: GameDashboardViewProps) {
  const rules = GAMES[slug];
  const [filtersOpen, setFiltersOpen] = useState(true);
  const { filters, draft, setDraft, apply, reset, activeCount } =
    useDashboardFilters();
  const { data: analytics, loading, error, reload } = useAnalytics(
    slug,
    filters
  );
  const {
    data: draws,
    loading: drawsLoading,
    error: drawsError,
    reload: reloadDraws,
  } = useDraws(slug, filters, 25);

  if (loading && !analytics) {
    return <DashboardSkeleton />;
  }

  if (error && !analytics) {
    return (
      <ErrorState message={error} onRetry={reload} className="mt-8" />
    );
  }

  const hasData = analytics && analytics.totalDraws > 0;

  return (
    <div className="space-y-8">
      <DashboardHeader
        title={rules.name}
        description={rules.description}
        accent={rules.color}
        badge={`${analytics?.totalDraws.toLocaleString("pt-BR") ?? 0} concursos`}
        engineVersion={analytics?.meta?.engineVersion}
      >
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
      </DashboardHeader>

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
              description={`Importe o histórico de concursos da ${rules.name} para visualizar KPIs, gráficos e backtests.`}
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
                <TabsTrigger value="history">Histórico</TabsTrigger>
                <TabsTrigger value="predictions">Palpites</TabsTrigger>
                <TabsTrigger value="backtest">Backtest</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <OverviewTab analytics={analytics!} rules={rules} draws={draws} />
              </TabsContent>
              <TabsContent value="distribution">
                <DistributionTab analytics={analytics!} color={rules.color} />
              </TabsContent>
              <TabsContent value="patterns">
                <PatternsTab analytics={analytics!} color={rules.color} slug={slug} />
              </TabsContent>
              <TabsContent value="history">
                <HistoryTab
                  draws={draws}
                  loading={drawsLoading}
                  error={drawsError}
                  onRetry={reloadDraws}
                  color={rules.color}
                />
              </TabsContent>
              <TabsContent value="predictions">
                <PredictionsTab slug={slug} color={rules.color} />
              </TabsContent>
              <TabsContent value="backtest">
                <BacktestTab slug={slug} color={rules.color} />
              </TabsContent>
            </Tabs>
          )}

          <MethodologyAccordion />
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


function HistoryTab({
  draws,
  loading,
  error,
  onRetry,
  color,
}: {
  draws: DrawRow[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  color: string;
}) {
  if (loading) return <TableSkeleton />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  return (
    <SectionShell
      title="Histórico de concursos"
      description="Últimos sorteios na janela filtrada"
    >
      <DataTable
        columns={[
          {
            key: "contest",
            header: "Concurso",
            render: (r) => (
              <span className="font-medium tabular-nums">#{r.contestNumber}</span>
            ),
          },
          {
            key: "date",
            header: "Data",
            render: (r) => formatDate(r.drawDate),
          },
          {
            key: "numbers",
            header: "Dezenas",
            render: (r) => (
              <DrawNumbers numbers={r.numbers} color={color} size="sm" />
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (r) =>
              r.accumulated ? (
                <Badge variant="warning">Acumulou</Badge>
              ) : (
                <Badge variant="outline">Sorteado</Badge>
              ),
          },
        ]}
        data={draws}
        keyExtractor={(r) => r.id}
        emptyMessage="Nenhum concurso na amostra"
      />
    </SectionShell>
  );
}

function PredictionsTab({
  slug,
  color,
}: {
  slug: GameSlug;
  color: string;
}) {
  const [strategy, setStrategy] = useState<GenerationStrategy>("HYBRID");
  const [mode, setMode] = useState<GenerationMode>("BALANCED");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [comparison, setComparison] = useState<
    Array<{ strategy: string; prediction: Record<string, unknown> }> | null
  >(null);

  const generate = async () => {
    setLoading(true);
    setComparison(null);
    try {
      const data = await generatePredictionApi(slug, { strategy, mode });
      setResult(data as Record<string, unknown>);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  const compare = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await compareStrategiesApi(slug, mode);
      setComparison(
        (data as { comparison: Array<{ strategy: string; prediction: Record<string, unknown> }> })
          .comparison
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionShell
        title="Geração de palpites"
        description="Sugestões baseadas no motor analítico v2"
      >
        <div className="glass rounded-xl p-6 space-y-4 max-w-xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Modo</Label>
              <Select
                value={mode}
                onChange={(e) => setMode(e.target.value as GenerationMode)}
                className="mt-1.5"
              >
                {GENERATION_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="text-xs">Estratégia</Label>
              <Select
                value={strategy}
                onChange={(e) =>
                  setStrategy(e.target.value as GenerationStrategy)
                }
                className="mt-1.5"
              >
                {GENERATION_STRATEGIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={generate} disabled={loading} style={{ background: color }}>
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar palpite
            </Button>
            <Button variant="outline" onClick={compare} disabled={loading}>
              <BarChart2 className="h-4 w-4 mr-2" />
              Comparar estratégias
            </Button>
          </div>
        </div>

        {result && (
          <div className="glass rounded-xl p-6 space-y-4 mt-6">
            {slug === "lotofacil" ? (
              <div className="flex justify-center max-w-[260px] mx-auto">
                <LotofacilVolanteCard
                  selectedNumbers={result.numbers as number[]}
                  color={color}
                  size="default"
                  showHeader={false}
                  showBalance={false}
                  className="w-full"
                />
              </div>
            ) : (
              <DrawNumbers
                numbers={result.numbers as number[]}
                color={color}
              />
            )}
            <p className="text-sm text-muted-foreground">
              {String(result.explanation ?? "")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                Score: {((result.score as number) * 100).toFixed(0)}%
              </Badge>
              {typeof result.hash === "string" && result.hash.length > 0 && (
                <Badge variant="outline" className="font-mono text-[10px]">
                  {String(result.hash).slice(0, 16)}…
                </Badge>
              )}
            </div>
          </div>
        )}

        {comparison && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
            {comparison.map((item) => (
              <div
                key={item.strategy}
                className="glass rounded-xl p-3 space-y-2 flex flex-col items-center"
              >
                <p className="text-xs font-medium text-center w-full truncate">
                  {GENERATION_STRATEGIES.find((s) => s.value === item.strategy)
                    ?.label ?? item.strategy}
                </p>
                {slug === "lotofacil" ? (
                  <LotofacilVolanteCard
                    selectedNumbers={item.prediction.numbers as number[]}
                    color={color}
                    size="default"
                    showHeader={false}
                    showBalance={false}
                    className="w-full max-w-[260px]"
                  />
                ) : (
                  <DrawNumbers
                    numbers={item.prediction.numbers as number[]}
                    color={color}
                    size="sm"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </SectionShell>
    </div>
  );
}

function BacktestTab({
  slug,
  color,
}: {
  slug: GameSlug;
  color: string;
}) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<BacktestReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runBacktestApi(slug, {
        windowSize: 40,
        trainMinDraws: 80,
        mode: "BALANCED",
      });
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no backtest");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <InfoBlock variant="accent">
        Backtest walk-forward: cada palpite usa apenas concursos anteriores.
        Não comprova capacidade preditiva futura.
      </InfoBlock>

      <div className="flex flex-wrap gap-2">
        <Button onClick={run} disabled={loading} style={{ background: color }}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <FlaskConical className="h-4 w-4 mr-2" />
          )}
          Executar backtest rápido
        </Button>
        <Link href={`/backtest?game=${slug}`}>
          <Button variant="outline">Backtest completo</Button>
        </Link>
      </div>

      {error && <ErrorState message={error} onRetry={run} />}

      {report && (
        <>
          <DataTable
            columns={[
              {
                key: "rank",
                header: "#",
                render: (r) => r.rank,
                className: "w-10",
              },
              {
                key: "strategy",
                header: "Estratégia",
                render: (r) =>
                  GENERATION_STRATEGIES.find((s) => s.value === r.strategy)
                    ?.label ?? r.strategy,
              },
              {
                key: "mean",
                header: "Média acertos",
                render: (r) => r.meanHits.toFixed(3),
              },
              {
                key: "partial",
                header: "Acertos parciais",
                render: (r) =>
                  `${r.partialHitRate.toFixed(1)}% (≥${r.partialHitThreshold})`,
              },
              {
                key: "corr",
                header: "Score×Acertos",
                render: (r) =>
                  r.scoreCorrelation?.toFixed(3) ?? "—",
              },
            ]}
            data={[
              ...report.ranking,
              ...(report.baselineRandom ? [report.baselineRandom] : []),
            ]}
            keyExtractor={(r) => r.strategy}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <StrategyRankingChart strategies={report.ranking} color={color} />
            <ScoreCorrelationChart
              strategies={[
                ...report.ranking,
                ...(report.baselineRandom ? [report.baselineRandom] : []),
              ]}
            />
          </div>
        </>
      )}

      {!report && !loading && !error && (
        <EmptyState
          title="Backtest não executado"
          description="Clique em Executar para comparar estratégias no histórico desta modalidade."
          icon="chart"
          actionLabel="Executar backtest rápido"
          onAction={run}
        />
      )}
    </div>
  );
}
