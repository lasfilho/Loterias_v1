"use client";

import { cn } from "@/lib/utils";
import { ChartShell } from "./chart-shell";

interface HeatmapCell {
  row: string;
  col: string;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapCell[];
  rows: string[];
  cols: string[];
  title?: string;
  description?: string;
  color?: string;
  maxValue?: number;
}

export function HeatmapChart({
  data,
  rows,
  cols,
  title = "Mapa de calor",
  description,
  color = "#7c6df0",
  maxValue,
}: HeatmapChartProps) {
  const max =
    maxValue ?? Math.max(...data.map((d) => d.value), 1);

  const getValue = (row: string, col: string) =>
    data.find((d) => d.row === row && d.col === col)?.value ?? 0;

  return (
    <ChartShell title={title} description={description} height={rows.length * 28 + 80}>
      <div className="overflow-x-auto scrollbar-thin">
        <div
          className="inline-grid gap-0.5 min-w-full"
          style={{
            gridTemplateColumns: `48px repeat(${cols.length}, minmax(28px, 1fr))`,
          }}
        >
          <div />
          {cols.map((col) => (
            <div
              key={col}
              className="text-[10px] text-center text-muted-foreground font-mono pb-1"
            >
              {col}
            </div>
          ))}
          {rows.map((row) => (
            <div key={row} className="contents">
              <div className="text-[10px] text-muted-foreground font-mono flex items-center">
                {row}
              </div>
              {cols.map((col) => {
                const value = getValue(row, col);
                const intensity = value / max;
                return (
                  <div
                    key={`${row}-${col}`}
                    title={`${row}×${col}: ${value}`}
                    className={cn(
                      "aspect-square rounded-sm min-h-[22px] transition-colors",
                      value === 0 && "bg-muted/40"
                    )}
                    style={
                      value > 0
                        ? {
                            background: `color-mix(in srgb, ${color} ${Math.round(intensity * 85 + 10)}%, transparent)`,
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </ChartShell>
  );
}

interface CooccurrenceHeatmapProps {
  pairs: Array<{ numberA: number; numberB: number; lift: number }>;
  numbers: number[];
  title?: string;
  color?: string;
}

export function CooccurrenceHeatmap({
  pairs,
  numbers,
  title = "Coocorrência (lift)",
  color = "#7c6df0",
}: CooccurrenceHeatmapProps) {
  const labels = numbers.map((n) => String(n).padStart(2, "0"));
  const data: HeatmapCell[] = pairs.flatMap((p) => [
    {
      row: String(p.numberA).padStart(2, "0"),
      col: String(p.numberB).padStart(2, "0"),
      value: p.lift,
    },
    {
      row: String(p.numberB).padStart(2, "0"),
      col: String(p.numberA).padStart(2, "0"),
      value: p.lift,
    },
  ]);

  return (
    <HeatmapChart
      data={data}
      rows={labels}
      cols={labels}
      title={title}
      description="Intensidade proporcional ao lift de coocorrência"
      color={color}
    />
  );
}
