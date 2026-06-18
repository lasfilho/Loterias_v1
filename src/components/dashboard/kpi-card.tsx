"use client";

import { cn } from "@/lib/utils";
import { TrendBadge } from "./trend-badge";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
  trendLabel?: string;
  accent?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  accent,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "glass relative overflow-hidden rounded-xl p-5 transition-all hover:shadow-md",
        className
      )}
    >
      {accent && (
        <div
          className="absolute inset-x-0 top-0 h-0.5 opacity-80"
          style={{ background: accent }}
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3 min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground leading-snug">{subtitle}</p>
          )}
          {trend && trendLabel && (
            <TrendBadge direction={trend} label={trendLabel} />
          )}
        </div>
        {icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: accent
                ? `color-mix(in srgb, ${accent} 15%, transparent)`
                : "var(--muted)",
              color: accent ?? "var(--primary)",
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
