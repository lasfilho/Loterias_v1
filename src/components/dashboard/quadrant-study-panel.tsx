"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { QuadrantStudy } from "@/modules/shared/analytics/quadrant-study";
import {
  numberToQuadrant,
  type QuadrantId,
} from "@/modules/shared/analytics/quadrant-volante";
import { GAMES } from "@/modules/shared/constants";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DataTable } from "@/components/dashboard/data-table";
import { SectionShell } from "@/components/dashboard/section-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  chartAxisStyle,
  chartGridStroke,
  chartTooltipStyle,
} from "@/components/charts/chart-shell";
import { cn } from "@/lib/utils";

const QUADRANT_TINT: Record<QuadrantId, string> = {
  1: "rgba(134, 239, 172, 0.12)",
  2: "rgba(125, 211, 252, 0.12)",
  3: "rgba(253, 224, 71, 0.12)",
  4: "rgba(196, 181, 253, 0.12)",
};

interface QuadrantStudyPanelProps {
  study: QuadrantStudy;
  color?: string;
}

export function QuadrantStudyPanel({
  study,
  color = "#22c55e",
}: QuadrantStudyPanelProps) {
  const rules = GAMES[study.layout.slug];
  const chartData = study.patternDistribution.slice(0, 12).map((b) => ({
    label: b.sortedKey,
    historical: Number(b.percentage.toFixed(2)),
    theoretical: Number(b.theoreticalPct.toFixed(2)),
    isBalanced: b.isBalanced,
  }));

  const quadrantChartData = study.aggregate.map((q) => ({
    label: `Q${q.quadrant}`,
    historical: Number(q.meanPerDraw.toFixed(2)),
    theoretical: Number(q.theoreticalMeanPerDraw.toFixed(2)),
  }));

  const relevanceBadge =
    study.relevance.score === "moderate" ? "warning" : "secondary";

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground space-y-2">
        <p>{study.definition}</p>
        <p>
          Média teórica por quadrante:{" "}
          <strong className="text-foreground">
            {study.theoreticalMeanPerQuadrant.map((m) => m.toFixed(2)).join(" · ")}
          </strong>{" "}
          dezenas/concurso.
        </p>
        <p>{study.chiSquare.interpretation}</p>
        <p>
          <Badge variant={relevanceBadge} className="mr-2">
            Relevância {study.relevance.score === "moderate" ? "moderada" : "baixa"}
          </Badge>
          {study.relevance.summary}
        </p>
        <p className="text-xs italic">{study.relevance.recommendation}</p>
      </div>

      <SectionShell
        title="Quadrantes do volante"
        description="Distribuição espacial Q1–Q4 (superior/inferior × esquerda/direita)"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          {study.aggregate.map((q) => (
            <KpiCard
              key={q.quadrant}
              title={`Q${q.quadrant} · ${q.label}`}
              value={q.meanPerDraw.toFixed(2)}
              subtitle={`teórico ${q.theoreticalMeanPerDraw.toFixed(2)} · desvio ${q.deviationPct >= 0 ? "+" : ""}${q.deviationPct.toFixed(1)}%`}
              accent={color}
            />
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <QuadrantVolantePreview study={study} color={rules.color} />
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base">Média por quadrante</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={quadrantChartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke()} />
                  <XAxis dataKey="label" tick={chartAxisStyle()} />
                  <YAxis tick={chartAxisStyle()} />
                  <Tooltip
                    contentStyle={chartTooltipStyle()}
                    formatter={(value, name) => [
                      Number(value ?? 0).toFixed(2),
                      name === "historical" ? "Histórico" : "Teórico",
                    ]}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "historical" ? "Histórico" : "Teórico"
                    }
                  />
                  <Bar dataKey="theoretical" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="historical" fill={color} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </SectionShell>

      <SectionShell
        title="Combinações de quadrantes"
        description={`Padrão dominante: ${study.dominantPattern.sortedKey} (${study.dominantPattern.percentage.toFixed(1)}% dos concursos)`}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          <KpiCard
            title="Padrão mais frequente"
            value={study.dominantPattern.sortedKey}
            subtitle={`Q1-Q2-Q3-Q4 · ${study.dominantPattern.percentage.toFixed(1)}%`}
            accent={color}
          />
          <KpiCard
            title="Concursos equilibrados"
            value={`${study.balancedDrawsPct.toFixed(1)}%`}
            subtitle={`teórico ${study.theoreticalBalancedPct.toFixed(1)}%`}
            accent={color}
          />
          <KpiCard
            title="Janela recente"
            value={study.recentWindow.dominantPattern}
            subtitle={`${study.recentWindow.size} concursos · ${study.recentWindow.balancedPct.toFixed(0)}% equilibrados`}
            accent={color}
          />
          <KpiCard
            title="Combinações distintas"
            value={study.patternDistribution.length}
            subtitle="padrões únicos observados"
            accent={color}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <PatternDistributionChart data={chartData} color={color} />
          <DataTable
            columns={[
              {
                key: "pattern",
                header: "Q1-Q2-Q3-Q4",
                render: (r) => (
                  <span className="font-mono">{r.sortedKey}</span>
                ),
              },
              {
                key: "occ",
                header: "Concursos",
                render: (r) => r.occurrences.toLocaleString("pt-BR"),
              },
              {
                key: "hist",
                header: "Histórico",
                render: (r) => `${r.percentage.toFixed(2)}%`,
              },
              {
                key: "theo",
                header: "Teórico",
                render: (r) => `${r.theoreticalPct.toFixed(2)}%`,
              },
              {
                key: "bal",
                header: "Equilibrado",
                render: (r) =>
                  r.isBalanced ? (
                    <Badge variant="success">Sim</Badge>
                  ) : (
                    <Badge variant="outline">Não</Badge>
                  ),
              },
            ]}
            data={study.patternDistribution.slice(0, 20)}
            keyExtractor={(r) => r.sortedKey}
          />
        </div>
      </SectionShell>

      <SectionShell
        title="Últimos concursos"
        description={`Médias recentes: ${study.recentWindow.meanPerQuadrant.map((m) => m.toFixed(1)).join(" · ")}`}
      >
        <DataTable
          columns={[
            {
              key: "contest",
              header: "Concurso",
              render: (r) => `#${r.contestNumber}`,
            },
            {
              key: "pattern",
              header: "Quadrantes",
              render: (r) => (
                <span className="font-mono text-xs">{r.patternLabel}</span>
              ),
            },
            {
              key: "sorted",
              header: "Padrão",
              render: (r) => (
                <span className="font-mono text-xs">{r.sortedKey}</span>
              ),
            },
            {
              key: "status",
              header: "Equilíbrio",
              render: (r) =>
                r.isBalanced ? (
                  <Badge variant="success">Equilibrado</Badge>
                ) : (
                  <Badge variant="secondary">Disperso</Badge>
                ),
            },
          ]}
          data={study.recentDraws}
          keyExtractor={(r) => String(r.contestNumber)}
        />
      </SectionShell>
    </div>
  );
}

function QuadrantVolantePreview({
  study,
  color,
}: {
  study: QuadrantStudy;
  color: string;
}) {
  const { layout } = study;
  const cells = Array.from(
    { length: layout.universeSize },
    (_, i) => i + 1
  );

  return (
    <Card className="glass overflow-hidden">
      <div
        className="px-3 py-2 text-center"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`,
        }}
      >
        <span className="text-sm font-black italic tracking-wide text-white uppercase">
          Volante · quadrantes
        </span>
      </div>
      <CardContent className="p-4">
        <div
          className="grid gap-0.5 relative rounded-lg overflow-hidden border-2 border-foreground/80"
          style={{
            gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
          }}
        >
          {cells.map((n) => {
            const q = numberToQuadrant(n, layout);
            const { row, column } = {
              row: Math.ceil(n / layout.cols),
              column: ((n - 1) % layout.cols) + 1,
            };
            const borderClasses = cn(
              row === layout.splitRow + 1 && "border-t-2 border-t-foreground/80",
              column === layout.splitCol + 1 && "border-l-2 border-l-foreground/80"
            );

            return (
              <div
                key={n}
                className={cn(
                  "flex items-center justify-center text-[8px] sm:text-[9px] font-semibold tabular-nums aspect-square",
                  borderClasses
                )}
                style={{ backgroundColor: QUADRANT_TINT[q] }}
                title={`Q${q}`}
              >
                {String(n).padStart(2, "0")}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-muted-foreground">
          <span>Q1 · superior esquerdo</span>
          <span>Q2 · superior direito</span>
          <span>Q3 · inferior esquerdo</span>
          <span>Q4 · inferior direito</span>
        </div>
      </CardContent>
    </Card>
  );
}

function PatternDistributionChart({
  data,
  color,
}: {
  data: Array<{
    label: string;
    historical: number;
    theoretical: number;
    isBalanced: boolean;
  }>;
  color: string;
}) {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-base">Top padrões (histórico × teórico)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke()} />
            <XAxis
              dataKey="label"
              tick={chartAxisStyle()}
              angle={-35}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={chartAxisStyle()} unit="%" />
            <Tooltip
              contentStyle={chartTooltipStyle()}
              formatter={(value, name) => [
                `${Number(value ?? 0).toFixed(2)}%`,
                name === "historical" ? "Histórico" : "Teórico",
              ]}
            />
            <Legend
              formatter={(value) =>
                value === "historical" ? "Histórico" : "Teórico"
              }
            />
            <Bar dataKey="theoretical" fill="#94a3b8" radius={[3, 3, 0, 0]} />
            <Bar dataKey="historical" fill={color} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
