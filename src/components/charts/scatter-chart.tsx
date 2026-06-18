"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import {
  ChartShell,
  chartAxisStyle,
  chartGridStroke,
  chartTooltipStyle,
} from "./chart-shell";

interface ScatterPoint {
  number: number;
  frequency: number;
  delay: number;
  score?: number;
}

interface DelayFrequencyScatterProps {
  data: ScatterPoint[];
  color?: string;
  title?: string;
  description?: string;
}

export function DelayFrequencyScatter({
  data,
  color = "#7c6df0",
  title = "Frequência × Atraso",
  description = "Cada ponto representa uma dezena",
}: DelayFrequencyScatterProps) {
  const chartData = data.map((d) => ({
    x: d.frequency,
    y: d.delay,
    z: d.score ?? 50,
    label: String(d.number).padStart(2, "0"),
  }));

  return (
    <ChartShell title={title} description={description}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke()} />
          <XAxis
            type="number"
            dataKey="x"
            name="Frequência"
            tick={chartAxisStyle()}
            label={{
              value: "Frequência",
              position: "insideBottom",
              offset: -2,
              style: { fill: "var(--muted-foreground)", fontSize: 10 },
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Atraso"
            tick={chartAxisStyle()}
            label={{
              value: "Atraso",
              angle: -90,
              position: "insideLeft",
              style: { fill: "var(--muted-foreground)", fontSize: 10 },
            }}
          />
          <ZAxis type="number" dataKey="z" range={[40, 200]} />
          <Tooltip
            contentStyle={chartTooltipStyle()}
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(value, name) => [value, name === "x" ? "Freq." : "Atraso"]}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.label
                ? `Dezena ${payload[0].payload.label}`
                : ""
            }
          />
          <Scatter data={chartData} fill={color} fillOpacity={0.75} />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

interface CompositeScoreScatterProps {
  scores: Array<{ number: number; score: number; rank: number }>;
  color?: string;
}

export function CompositeScoreScatter({
  scores,
  color = "#7c6df0",
}: CompositeScoreScatterProps) {
  const data = scores.slice(0, 30).map((s) => ({
    number: s.number,
    frequency: s.rank,
    delay: +(s.score * 100).toFixed(1),
    score: s.score * 100,
  }));

  return (
    <DelayFrequencyScatter
      data={data}
      color={color}
      title="Ranking × Score composto"
      description="Eixo X: ranking (menor = melhor) · Eixo Y: score %"
    />
  );
}
