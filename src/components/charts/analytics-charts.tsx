"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  chartAxisStyle,
  chartGridStroke,
  chartTooltipStyle,
} from "./chart-shell";

interface FrequencyChartProps {
  data: { number: number; count: number; percentage: number }[];
  color?: string;
  title?: string;
}

export function FrequencyChart({
  data,
  color = "#8b5cf6",
  title = "Frequência por Número",
}: FrequencyChartProps) {
  const chartData = data.map((d) => ({
    num: String(d.number).padStart(2, "0"),
    count: d.count,
    pct: d.percentage.toFixed(1),
  }));

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke()} />
            <XAxis
              dataKey="num"
              tick={chartAxisStyle()}
              interval={data.length > 30 ? 4 : 1}
            />
            <YAxis tick={chartAxisStyle()} />
            <Tooltip
              contentStyle={chartTooltipStyle()}
              formatter={(value, _name, props) => [
                `${value} (${props.payload.pct}%)`,
                "Ocorrências",
              ]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={color} fillOpacity={0.7 + (i % 3) * 0.1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface DelayChartProps {
  data: { number: number; delay: number }[];
  color?: string;
  title?: string;
}

export function DelayChart({
  data,
  color = "#8b5cf6",
  title = "Atraso por Número",
}: DelayChartProps) {
  const sorted = [...data].sort((a, b) => b.delay - a.delay).slice(0, 20);
  const chartData = sorted.map((d) => ({
    num: String(d.number).padStart(2, "0"),
    delay: d.delay,
  }));

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke()} />
            <XAxis type="number" tick={chartAxisStyle()} />
            <YAxis
              type="category"
              dataKey="num"
              tick={chartAxisStyle()}
              width={30}
            />
            <Tooltip
              contentStyle={chartTooltipStyle()}
              formatter={(value) => [`${value} concursos`, "Atraso"]}
            />
            <Bar dataKey="delay" fill={color} fillOpacity={0.8} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ParityChartProps {
  even: number;
  odd: number;
  color?: string;
}

export function ParityChart({ even, odd, color = "#8b5cf6" }: ParityChartProps) {
  const data = [
    { name: "Pares", value: even, fill: color },
    { name: "Ímpares", value: odd, fill: "#3b82f6" },
  ];

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-base">Distribuição Par / Ímpar</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke()} />
            <XAxis dataKey="name" tick={chartAxisStyle()} />
            <YAxis tick={chartAxisStyle()} />
            <Tooltip contentStyle={chartTooltipStyle()} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface RangeChartProps {
  data: { range: string; count: number; percentage: number }[];
  color?: string;
}

export function RangeChart({ data, color = "#8b5cf6" }: RangeChartProps) {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-base">Distribuição por Faixa</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke()} />
            <XAxis dataKey="range" tick={chartAxisStyle()} />
            <YAxis tick={chartAxisStyle()} />
            <Tooltip
              contentStyle={chartTooltipStyle()}
              formatter={(value, _n, props) => [
                `${value} (${props.payload.percentage.toFixed(1)}%)`,
                "Ocorrências",
              ]}
            />
            <Bar dataKey="count" fill={color} fillOpacity={0.8} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
