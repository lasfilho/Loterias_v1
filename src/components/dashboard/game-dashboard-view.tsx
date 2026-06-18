"use client";

import { useState } from "react";
import {
  Activity,
  BarChart2,
  Calendar,
  FlaskConical,
  Hash,
  Layers,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { GameSlug } from "@/modules/shared/constants";
import { GAMES } from "@/modules/shared/constants";
import type { FullAnalyticsReport } from "@/modules/shared/analytics/types";
import { useAnalytics } from "@/hooks/use-analytics";
import { useDraws } from "@/hooks/use-draws";
import { useDashboardFilters } from "@/hooks/use-dashboard-filters";
import { KpiCard } from "@/components/dashboard/kpi-card";
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
  DelayChart,
  FrequencyChart,
  ParityChart,
  RangeChart,
} from "@/components/charts/analytics-charts";
import { MultiTrendChart, TrendLineChart } from "@/components/charts/trend-charts";
import { CooccurrenceHeatmap } from "@/components/charts/heatmap-chart";
import { DelayFrequencyScatter } from "@/components/charts/scatter-chart";
import { DrawNumbers } from "@/components/domain/number-ball";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import type { LotofacilFrameCoreStudy } from "@/modules/lotofacil/frame-core-study";
import { LotofacilFrameCorePanel } from "@/components/dashboard/lotofacil-frame-core-panel";
import { formatDate } from "@/lib/utils";
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
import { TrendBadge } from "@/components/dashboard/trend-badge";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

interface GameDashboardViewProps {
  slug: GameSlug;
}

export function GameDashboardView({ slug }: GameDashboardViewProps) {
  const rules = GAMES[slug];
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
      />

      <InfoBlock variant="accent">
        Indicadores derivados de dados históricos. Não representam probabilidade
        oficial nem garantia de acerto em sorteios futuros.
      </InfoBlock>

      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
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

        <DashboardFiltersPanel
          draft={draft}
          setDraft={setDraft}
          onApply={apply}
          onReset={reset}
          activeCount={activeCount}
          accent={rules.color}
        />
      </div>
    </div>
  );
}

function OverviewTab({
  analytics,
  rules,
  draws,
}: {
  analytics: FullAnalyticsReport;
  rules: (typeof GAMES)[GameSlug];
  draws: DrawRow[];
}) {
  const latest = draws[0];
  const upTrends = analytics.intermediate.multiHorizonTrends.filter(
    (t) => t.shortTerm.direction === "up"
  ).length;

  return (
    <div className="space-y-8">
      <SectionShell title="Indicadores principais" description="KPIs da amostra filtrada">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Concursos analisados"
            value={analytics.totalDraws.toLocaleString("pt-BR")}
            subtitle={`Último: #${analytics.lastContest ?? "—"}`}
            icon={<Hash className="h-4 w-4" />}
            accent={rules.color}
          />
          <KpiCard
            title="Último sorteio"
            value={
              analytics.lastDrawDate
                ? formatDate(analytics.lastDrawDate)
                : "—"
            }
            icon={<Calendar className="h-4 w-4" />}
            accent={rules.color}
          />
          <KpiCard
            title="Cobertura do universo"
            value={`${analytics.advanced.coverage.coveragePct.toFixed(0)}%`}
            subtitle={`${analytics.advanced.coverage.coveredNumbers}/${analytics.advanced.coverage.universeSize} dezenas`}
            icon={<Layers className="h-4 w-4" />}
            accent={rules.color}
          />
          <KpiCard
            title="Diversidade média"
            value={analytics.advanced.diversity.score.toFixed(2)}
            subtitle={analytics.advanced.diversity.note}
            icon={<Activity className="h-4 w-4" />}
            trend="stable"
            trendLabel={`${upTrends} dezenas em alta`}
            accent={rules.color}
          />
        </div>
      </SectionShell>

      {latest && (
        <SectionShell title="Último resultado" description="Sorteio mais recente na base">
          <div className="glass rounded-xl p-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="secondary">Concurso {latest.contestNumber}</Badge>
              {latest.accumulated && <Badge variant="warning">Acumulou</Badge>}
              <span className="text-xs text-muted-foreground">
                {formatDate(latest.drawDate)}
              </span>
            </div>
            <DrawNumbers numbers={latest.numbers} color={rules.color} />
          </div>
        </SectionShell>
      )}

      <SectionShell
        title="Tendências"
        description="Evolução de repetições e taxas por horizonte temporal"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <TrendLineChart
            data={analytics.basic.consecutiveRepetition.perDraw
              .slice(-40)
              .map((d) => ({
                label: String(d.contestNumber),
                value: d.repeatCount,
              }))}
            color={rules.color}
            title="Repetições consecutivas"
            description="Dezenas repetidas vs concurso anterior"
            valueLabel="Repetições"
          />
          <MultiTrendChart
            trends={analytics.intermediate.multiHorizonTrends}
            color={rules.color}
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {analytics.hotNumbers.slice(0, 6).map((n) => (
            <TrendBadge key={n} direction="up" label={`${String(n).padStart(2, "0")} quente`} />
          ))}
          {analytics.coldNumbers.slice(0, 4).map((n) => (
            <TrendBadge key={n} direction="down" label={`${String(n).padStart(2, "0")} fria`} />
          ))}
        </div>
      </SectionShell>
    </div>
  );
}

function DistributionTab({
  analytics,
  color,
}: {
  analytics: FullAnalyticsReport;
  color: string;
}) {
  const scatterData = analytics.basic.frequency.map((f) => {
    const delay = analytics.basic.delays.find((d) => d.number === f.number);
    const score = analytics.advanced.compositeScores.find(
      (s) => s.number === f.number
    );
    return {
      number: f.number,
      frequency: f.count,
      delay: delay?.currentDelay ?? 0,
      score: score?.score,
    };
  });

  return (
    <div className="space-y-8">
      <SectionShell title="Distribuição estatística">
        <div className="grid gap-6 lg:grid-cols-2">
          <FrequencyChart data={analytics.frequency} color={color} />
          <DelayChart
            data={analytics.basic.delays.map((d) => ({
              number: d.number,
              delay: d.currentDelay,
            }))}
            color={color}
          />
          <ParityChart
            even={analytics.parity.even}
            odd={analytics.parity.odd}
            color={color}
          />
          <RangeChart data={analytics.ranges} color={color} />
        </div>
      </SectionShell>

      <SectionShell title="Relação frequência × atraso">
        <DelayFrequencyScatter data={scatterData} color={color} />
      </SectionShell>

      <SectionShell title="Estatísticas de soma">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Média" value={analytics.basic.sumStatistics.mean.toFixed(1)} accent={color} />
          <KpiCard title="Mediana" value={analytics.basic.sumStatistics.median.toFixed(0)} accent={color} />
          <KpiCard title="Desvio padrão" value={analytics.basic.sumStatistics.stdDev.toFixed(1)} accent={color} />
          <KpiCard
            title="Faixa"
            value={`${analytics.basic.sumStatistics.min}–${analytics.basic.sumStatistics.max}`}
            accent={color}
          />
        </div>
      </SectionShell>
    </div>
  );
}

function PatternsTab({
  analytics,
  color,
  slug,
}: {
  analytics: FullAnalyticsReport;
  color: string;
  slug: GameSlug;
}) {
  const frameCoreStudy =
    slug === "lotofacil"
      ? (analytics.gameSpecific.data.frameCoreStudy as
          | LotofacilFrameCoreStudy
          | undefined)
      : undefined;

  const topCooc = analytics.intermediate.cooccurrences
    .sort((a, b) => b.lift - a.lift)
    .slice(0, 8);
  const heatNumbers = [
    ...new Set(
      topCooc.flatMap((c) => [c.numberA, c.numberB])
    ),
  ].slice(0, 8);

  return (
    <div className="space-y-8">
      {frameCoreStudy && (
        <LotofacilFrameCorePanel study={frameCoreStudy} color={color} />
      )}

      <SectionShell title="Pares e trios recorrentes">
        <div className="grid gap-6 lg:grid-cols-2">
          <DataTable
            columns={[
              {
                key: "pair",
                header: "Par",
                render: (r) => (
                  <span className="font-mono">
                    {String(r.pair[0]).padStart(2, "0")} +{" "}
                    {String(r.pair[1]).padStart(2, "0")}
                  </span>
                ),
              },
              {
                key: "count",
                header: "Ocorrências",
                render: (r) => <Badge variant="outline">{r.count}x</Badge>,
              },
              {
                key: "pct",
                header: "%",
                render: (r) => `${r.percentage.toFixed(2)}%`,
              },
            ]}
            data={analytics.topPairs.slice(0, 15)}
            keyExtractor={(r) => `${r.pair[0]}-${r.pair[1]}`}
          />
          <DataTable
            columns={[
              {
                key: "triple",
                header: "Trio",
                render: (r) => (
                  <span className="font-mono text-xs">
                    {r.triple.map((n) => String(n).padStart(2, "0")).join(" · ")}
                  </span>
                ),
              },
              {
                key: "count",
                header: "Count",
                render: (r) => r.count,
              },
            ]}
            data={analytics.intermediate.topTriples.slice(0, 15)}
            keyExtractor={(r) => r.triple.join("-")}
          />
        </div>
      </SectionShell>

      {heatNumbers.length >= 4 && (
        <SectionShell title="Coocorrência (heatmap)">
          <CooccurrenceHeatmap
            pairs={topCooc}
            numbers={heatNumbers}
            color={color}
          />
        </SectionShell>
      )}

      <SectionShell title="Padrões de sequência e gaps">
        <div className="grid gap-6 lg:grid-cols-2">
          <DataTable
            columns={[
              { key: "len", header: "Sequência", render: (r) => `${r.length} consecutivos` },
              { key: "occ", header: "Ocorrências", render: (r) => r.occurrences },
              { key: "pct", header: "%", render: (r) => `${r.percentage.toFixed(1)}%` },
            ]}
            data={analytics.intermediate.sequencePatterns}
            keyExtractor={(r) => String(r.length)}
            emptyMessage="Sem padrões de sequência detectados"
          />
          <DataTable
            columns={[
              { key: "gap", header: "Gap", render: (r) => r.gap },
              { key: "count", header: "Frequência", render: (r) => r.count },
              { key: "pct", header: "%", render: (r) => `${r.percentage.toFixed(1)}%` },
            ]}
            data={analytics.intermediate.gapDistribution.slice(0, 12)}
            keyExtractor={(r) => String(r.gap)}
          />
        </div>
      </SectionShell>
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
            <DrawNumbers
              numbers={result.numbers as number[]}
              color={color}
            />
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
          <div className="space-y-4 mt-6">
            {comparison.map((item) => (
              <div key={item.strategy} className="glass rounded-xl p-4">
                <p className="text-sm font-medium mb-2">
                  {GENERATION_STRATEGIES.find((s) => s.value === item.strategy)
                    ?.label ?? item.strategy}
                </p>
                <DrawNumbers
                  numbers={item.prediction.numbers as number[]}
                  color={color}
                  size="sm"
                />
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
