"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartShell,
  chartAxisStyle,
  chartGridStroke,
  chartTooltipStyle,
} from "./chart-shell";
import type { BacktestStrategyReport } from "@/modules/shared/backtest/types";
import { GENERATION_STRATEGIES } from "@/modules/shared/prediction/types";

const STRATEGY_COLORS = [
  "#7c6df0",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#64748b",
];

function strategyLabel(value: string) {
  return (
    GENERATION_STRATEGIES.find((s) => s.value === value)?.label ??
    (value === "RANDOM" ? "Aleatório (baseline)" : value)
  );
}

export function StrategyRankingChart({
  strategies,
  color,
}: {
  strategies: BacktestStrategyReport[];
  color?: string;
}) {
  const data = strategies.map((s) => ({
    name: strategyLabel(s.strategy),
    meanHits: +s.meanHits.toFixed(3),
    rank: s.rank,
  }));

  return (
    <ChartShell
      title="Ranking por média de acertos"
      description="Maior média não implica vantagem futura"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke()} />
          <XAxis type="number" tick={chartAxisStyle()} />
          <YAxis
            type="category"
            dataKey="name"
            tick={chartAxisStyle()}
            width={120}
          />
          <Tooltip contentStyle={chartTooltipStyle()} />
          <Bar
            dataKey="meanHits"
            fill={color ?? "#7c6df0"}
            radius={[0, 4, 4, 0]}
            name="Média acertos"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function HitBandComparisonChart({
  strategies,
}: {
  strategies: BacktestStrategyReport[];
}) {
  const bandLabels = strategies[0]?.hitBandRates.map((b) => b.label) ?? [];
  const data = bandLabels.map((label, i) => {
    const row: Record<string, string | number> = { band: label };
    strategies.slice(0, 5).forEach((s) => {
      row[strategyLabel(s.strategy)] = s.hitBandRates[i]?.rate ?? 0;
    });
    return row;
  });

  const keys = strategies.slice(0, 5).map((s) => strategyLabel(s.strategy));

  return (
    <ChartShell
      title="Acertos por faixa de premiação"
      description="Distribuição % por faixa histórica"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke()} />
          <XAxis dataKey="band" tick={chartAxisStyle()} />
          <YAxis tick={chartAxisStyle()} unit="%" />
          <Tooltip contentStyle={chartTooltipStyle()} />
          <Legend />
          {keys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={STRATEGY_COLORS[i % STRATEGY_COLORS.length]}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function ScoreCorrelationChart({
  strategies,
}: {
  strategies: BacktestStrategyReport[];
}) {
  const data = strategies
    .filter((s) => s.scoreCorrelation !== null)
    .map((s) => ({
      name: strategyLabel(s.strategy),
      correlation: +(s.scoreCorrelation ?? 0).toFixed(3),
    }));

  return (
    <ChartShell
      title="Score previsto × acertos reais"
      description="Correlação de Pearson por estratégia"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke()} />
          <XAxis dataKey="name" tick={chartAxisStyle()} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={chartAxisStyle()} domain={[-1, 1]} />
          <Tooltip contentStyle={chartTooltipStyle()} />
          <Bar dataKey="correlation" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.correlation >= 0
                    ? STRATEGY_COLORS[2]
                    : STRATEGY_COLORS[4]
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function PeriodMeanHitsChart({
  strategies,
  color,
}: {
  strategies: BacktestStrategyReport[];
  color?: string;
}) {
  const top = strategies.slice(0, 3);
  if (top.length === 0 || !top[0].periodAggregates.length) {
    return null;
  }

  const periods = top[0].periodAggregates.map((p) => p.periodLabel);
  const data = periods.map((label, i) => {
    const row: Record<string, string | number> = { period: label };
    top.forEach((s) => {
      row[strategyLabel(s.strategy)] = +(
        s.periodAggregates[i]?.meanHits ?? 0
      ).toFixed(3);
    });
    return row;
  });

  return (
    <ChartShell
      title="Média de acertos por período"
      description="Agregação em blocos de concursos"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke()} />
          <XAxis dataKey="period" tick={chartAxisStyle()} />
          <YAxis tick={chartAxisStyle()} />
          <Tooltip contentStyle={chartTooltipStyle()} />
          <Legend />
          {top.map((s, i) => (
            <Line
              key={s.strategy}
              type="monotone"
              dataKey={strategyLabel(s.strategy)}
              stroke={i === 0 ? (color ?? STRATEGY_COLORS[0]) : STRATEGY_COLORS[i]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
