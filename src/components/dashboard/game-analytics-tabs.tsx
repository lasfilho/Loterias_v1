"use client";

import {
  Activity,
  Calendar,
  Hash,
  Layers,
} from "lucide-react";
import type { GameSlug } from "@/modules/shared/constants";
import { GAMES } from "@/modules/shared/constants";
import type { FullAnalyticsReport } from "@/modules/shared/analytics/types";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SectionShell } from "@/components/dashboard/section-shell";
import { DataTable } from "@/components/dashboard/data-table";
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
import type { LotofacilFrameCoreStudy } from "@/modules/lotofacil/frame-core-study";
import type { QuadrantStudy } from "@/modules/shared/analytics/quadrant-study";
import { LotofacilFrameCorePanel } from "@/components/dashboard/lotofacil-frame-core-panel";
import { QuadrantStudyPanel } from "@/components/dashboard/quadrant-study-panel";
import { SpecialNumbersPanel } from "@/components/dashboard/special-numbers-panel";
import { TrendBadge } from "@/components/dashboard/trend-badge";
import { formatDate } from "@/lib/utils";
import type { DrawRow } from "@/types/dashboard";

export function OverviewTab({
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

export function DistributionTab({
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

      <SectionShell
        title="Primos e Fibonacci"
        description="Ocorrência de dezenas primas e da sequência de Fibonacci no histórico"
      >
        <SpecialNumbersPanel
          study={analytics.basic.specialNumbers}
          color={color}
        />
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

export function PatternsTab({
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

  const quadrantStudy =
    slug === "megasena" || slug === "quina"
      ? (analytics.gameSpecific.data.quadrantStudy as QuadrantStudy | undefined)
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

      {quadrantStudy && (
        <QuadrantStudyPanel study={quadrantStudy} color={color} />
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
