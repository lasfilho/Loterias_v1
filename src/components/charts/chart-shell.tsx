"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  height?: number;
  className?: string;
  action?: React.ReactNode;
}

export function ChartShell({
  title,
  description,
  children,
  height = 280,
  className,
  action,
}: ChartShellProps) {
  return (
    <Card className={cn("glass overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>{children}</div>
      </CardContent>
    </Card>
  );
}

export function chartTooltipStyle() {
  return {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "var(--foreground)",
    boxShadow: "0 4px 12px color-mix(in srgb, var(--foreground) 8%, transparent)",
  };
}

export function chartAxisStyle() {
  return { fill: "var(--muted-foreground)", fontSize: 11 };
}

export function chartGridStroke() {
  return "var(--chart-grid)";
}
