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
import type { LotofacilFrameCoreStudy } from "@/modules/lotofacil/frame-core-study";
import {
  isLotofacilFrameNumber,
  LOTOFACIL_GRID_SIZE,
} from "@/modules/lotofacil/volante.constants";
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

interface LotofacilFrameCorePanelProps {
  study: LotofacilFrameCoreStudy;
  color?: string;
}

export function LotofacilFrameCorePanel({
  study,
  color = "#7c3aed",
}: LotofacilFrameCorePanelProps) {
  const chartData = study.splitDistribution
    .filter((b) => b.occurrences > 0 || b.theoreticalPct >= 0.5)
    .sort((a, b) => a.frameCount - b.frameCount)
    .map((b) => ({
      label: `${b.frameCount}M/${b.coreCount}C`,
      historical: Number(b.percentage.toFixed(2)),
      theoretical: Number(b.theoreticalPct.toFixed(2)),
      isBalanced: b.isBalanced,
    }));

  return (
    <div className="space-y-8">
      <InfoBanner study={study} />

      <SectionShell
        title="Moldura × Centro"
        description="Distribuição espacial por concurso no volante 5×5"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          <KpiCard
            title="Média moldura / concurso"
            value={study.meanFramePerDraw.toFixed(2)}
            subtitle="de 15 dezenas sorteadas"
            accent={color}
          />
          <KpiCard
            title="Média centro / concurso"
            value={study.meanCorePerDraw.toFixed(2)}
            subtitle="de 15 dezenas sorteadas"
            accent={color}
          />
          <KpiCard
            title="Concursos equilibrados"
            value={`${study.balancedDrawsPct.toFixed(1)}%`}
            subtitle={`${study.balancedDrawsCount.toLocaleString("pt-BR")} com 9–10M / 5–6C`}
            accent={color}
          />
          <KpiCard
            title="Split dominante"
            value={`${study.dominantSplit.frameCount} + ${study.dominantSplit.coreCount}`}
            subtitle={`${study.dominantSplit.percentage.toFixed(1)}% dos concursos`}
            accent={color}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <VolanteGrid color={color} />
          <SplitDistributionChart data={chartData} color={color} />
        </div>
      </SectionShell>

      <SectionShell
        title="Comparativo histórico × teórico"
        description="Probabilidade hipergeométrica vs frequência observada"
      >
        <DataTable
          columns={[
            {
              key: "split",
              header: "Moldura / Centro",
              render: (r) => (
                <span className="font-mono">
                  {r.frameCount} / {r.coreCount}
                </span>
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
              header: "Faixa típica",
              render: (r) =>
                r.isBalanced ? (
                  <Badge variant="success">9–10 / 5–6</Badge>
                ) : (
                  <Badge variant="outline">—</Badge>
                ),
            },
          ]}
          data={study.splitDistribution.filter((b) => b.occurrences > 0)}
          keyExtractor={(r) => `${r.frameCount}-${r.coreCount}`}
        />
      </SectionShell>

      <SectionShell
        title="Últimos concursos"
        description={`Janela recente: média ${study.recentWindow.meanFrame.toFixed(1)} moldura · ${study.recentWindow.balancedPct.toFixed(0)}% equilibrados (${study.recentWindow.size} concursos)`}
      >
        <DataTable
          columns={[
            {
              key: "contest",
              header: "Concurso",
              render: (r) => `#${r.contestNumber}`,
            },
            {
              key: "frame",
              header: "Moldura",
              render: (r) => r.frameCount,
            },
            {
              key: "core",
              header: "Centro",
              render: (r) => r.coreCount,
            },
            {
              key: "status",
              header: "Equilíbrio",
              render: (r) =>
                r.isBalanced ? (
                  <Badge variant="success">Na faixa</Badge>
                ) : (
                  <Badge variant="secondary">Fora</Badge>
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

function InfoBanner({ study }: { study: LotofacilFrameCoreStudy }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      {study.definition} Expectativa teórica de concursos na faixa 9–10 / 5–6:{" "}
      <strong className="text-foreground">
        {study.theoreticalBalancedPct.toFixed(1)}%
      </strong>
      . Observado no histórico:{" "}
      <strong className="text-foreground">
        {study.balancedDrawsPct.toFixed(1)}%
      </strong>
      .
    </div>
  );
}

function VolanteGrid({ color }: { color: string }) {
  const cells = Array.from({ length: 25 }, (_, i) => i + 1);

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-base">Mapa do volante</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="grid gap-1.5 mx-auto max-w-xs"
          style={{
            gridTemplateColumns: `repeat(${LOTOFACIL_GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {cells.map((n) => {
            const isFrame = isLotofacilFrameNumber(n);
            return (
              <div
                key={n}
                className={cn(
                  "aspect-square rounded-md flex items-center justify-center text-xs font-bold tabular-nums border",
                  isFrame
                    ? "border-current"
                    : "border-dashed border-muted-foreground/40"
                )}
                style={
                  isFrame
                    ? { color, backgroundColor: `${color}22` }
                    : undefined
                }
                title={isFrame ? "Moldura" : "Centro"}
              >
                {String(n).padStart(2, "0")}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground justify-center">
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded border"
              style={{ backgroundColor: `${color}22`, borderColor: color }}
            />
            Moldura (16)
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded border border-dashed border-muted-foreground/50" />
            Centro (9)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function SplitDistributionChart({
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
        <CardTitle className="text-base">Distribuição por concurso</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke()} />
            <XAxis dataKey="label" tick={chartAxisStyle()} />
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
