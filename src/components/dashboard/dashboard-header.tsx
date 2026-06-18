interface DashboardHeaderProps {
  title: string;
  description?: string;
  accent?: string;
  badge?: string;
  engineVersion?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({
  title,
  description,
  accent,
  badge,
  engineVersion,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 sm:p-8">
      <div
        className="absolute inset-0 dashboard-grid-bg opacity-40 pointer-events-none"
        aria-hidden
      />
      {accent && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ background: accent }}
        />
      )}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {title}
            </h1>
            {badge && (
              <span
                className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{
                  background: accent
                    ? `color-mix(in srgb, ${accent} 14%, transparent)`
                    : "var(--muted)",
                  color: accent,
                }}
              >
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
          {engineVersion && (
            <p className="text-[11px] text-muted-foreground font-mono">
              Analytics Engine v{engineVersion}
            </p>
          )}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </div>
  );
}
