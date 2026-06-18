"use client";

import {
  CartesianGrid,
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

interface TrendLineChartProps {
  data: Array<{ label: string; value: number; baseline?: number }>;
  color?: string;
  title?: string;
  description?: string;
  valueLabel?: string;
}

export function TrendLineChart({
  data,
  color = "#7c6df0",
  title = "Evolução temporal",
  description,
  valueLabel = "Valor",
}: TrendLineChartProps) {
  return (
    <ChartShell title={title} description={description}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke()} />
          <XAxis
            dataKey="label"
            tick={chartAxisStyle()}
            interval="preserveStartEnd"
          />
          <YAxis tick={chartAxisStyle()} />
          <Tooltip
            contentStyle={chartTooltipStyle()}
            formatter={(value) => [Number(value).toFixed(2), valueLabel]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
          {data.some((d) => d.baseline !== undefined) && (
            <Line
              type="monotone"
              dataKey="baseline"
              stroke="var(--muted-foreground)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

interface MultiTrendChartProps {
  trends: Array<{
    number: number;
    shortTerm: { direction: string; recentRate: number };
    mediumTerm: { direction: string; recentRate: number };
    longTerm: { direction: string; recentRate: number };
  }>;
  color?: string;
  title?: string;
}

export function MultiTrendChart({
  trends,
  color = "#7c6df0",
  title = "Taxa de aparição por horizonte",
}: MultiTrendChartProps) {
  const top = trends.slice(0, 12);
  const data = top.map((t) => ({
    num: String(t.number).padStart(2, "0"),
    curto: +(t.shortTerm.recentRate * 100).toFixed(1),
    medio: +(t.mediumTerm.recentRate * 100).toFixed(1),
    longo: +(t.longTerm.recentRate * 100).toFixed(1),
  }));

  return (
    <ChartShell title={title} description="Top 12 dezenas — taxa % por janela">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke()} />
          <XAxis dataKey="num" tick={chartAxisStyle()} />
          <YAxis tick={chartAxisStyle()} unit="%" />
          <Tooltip contentStyle={chartTooltipStyle()} />
          <Line type="monotone" dataKey="curto" stroke={color} strokeWidth={2} dot={false} name="Curto" />
          <Line type="monotone" dataKey="medio" stroke="#3b82f6" strokeWidth={2} dot={false} name="Médio" />
          <Line type="monotone" dataKey="longo" stroke="#94a3b8" strokeWidth={1.5} dot={false} name="Longo" />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
