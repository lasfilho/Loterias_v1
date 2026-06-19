"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SpecialNumberCategoryStudy } from "@/modules/shared/analytics/types";
import { DataTable } from "@/components/dashboard/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  chartAxisStyle,
  chartGridStroke,
  chartTooltipStyle,
} from "@/components/charts/chart-shell";
import { formatNumbers } from "@/lib/utils";

interface SpecialNumbersPanelProps {
  study: import("@/modules/shared/analytics/types").SpecialNumbersAnalysis;
  color?: string;
}

export function SpecialNumbersPanel({
  study,
  color = "#8b5cf6",
}: SpecialNumbersPanelProps) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">{study.definition}</p>

      <div className="grid gap-8 lg:grid-cols-2">
        <CategoryBlock category={study.primes} color={color} accent="#6366f1" />
        <CategoryBlock
          category={study.fibonacci}
          color={color}
          accent="#f59e0b"
        />
      </div>
    </div>
  );
}

function CategoryBlock({
  category,
  color,
  accent,
}: {
  category: SpecialNumberCategoryStudy;
  color: string;
  accent: string;
}) {
  const chartData = category.perDrawDistribution.map((row) => ({
    label: String(row.count),
    concursos: row.occurrences,
    pct: row.percentage.toFixed(1),
  }));

  return (
    <div className="glass rounded-xl p-5 space-y-5">
      <div>
        <h3 className="text-base font-semibold">{category.label}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Universo: {formatNumbers(category.numbersInUniverse)} (
          {category.universeCount} dezenas)
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
          <KpiCard
            title="Média por concurso"
            value={category.meanPerDraw.toFixed(2)}
            subtitle={`Teórico: ${category.theoreticalMeanPerDraw.toFixed(2)}`}
            accent={accent}
          />
          <KpiCard
            title="Moda (mais frequente)"
            value={`${category.dominantCountPerDraw.count} dezenas`}
            subtitle={`${category.dominantCountPerDraw.percentage.toFixed(1)}% dos concursos`}
            accent={accent}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base">
                {category.label} × {category.complementary.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    {
                      name: category.label,
                      value: category.aggregate.count,
                      fill: accent,
                    },
                    {
                      name: category.complementary.label,
                      value: category.complementary.count,
                      fill: "#94a3b8",
                    },
                  ]}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartGridStroke()}
                  />
                  <XAxis dataKey="name" tick={chartAxisStyle()} />
                  <YAxis tick={chartAxisStyle()} />
                  <Tooltip contentStyle={chartTooltipStyle()} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={accent} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-3 justify-center text-xs text-muted-foreground">
                <Badge variant="outline">
                  {category.label}: {category.aggregate.percentage.toFixed(1)}%
                </Badge>
                <Badge variant="outline">
                  {category.complementary.label}:{" "}
                  {category.complementary.percentage.toFixed(1)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base">
                Quantidade por concurso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartGridStroke()}
                  />
                  <XAxis dataKey="label" tick={chartAxisStyle()} />
                  <YAxis tick={chartAxisStyle()} />
                  <Tooltip
                    contentStyle={chartTooltipStyle()}
                    formatter={(value, _name, props) => [
                      `${value} concursos (${props.payload.pct}%)`,
                      "Ocorrências",
                    ]}
                  />
                  <Bar dataKey="concursos" fill={color} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <DataTable
          columns={[
            {
              key: "num",
              header: "Dezena",
              render: (r) => (
                <span className="font-mono">
                  {String(r.number).padStart(2, "0")}
                </span>
              ),
            },
            {
              key: "count",
              header: "Sorteios",
              render: (r) => r.count.toLocaleString("pt-BR"),
            },
            {
              key: "pct",
              header: "% concursos",
              render: (r) => `${r.percentage.toFixed(2)}%`,
            },
          ]}
          data={category.frequencyByNumber}
          keyExtractor={(r) => String(r.number)}
        />
    </div>
  );
}
