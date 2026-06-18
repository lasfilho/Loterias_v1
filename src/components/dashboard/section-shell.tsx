import { cn } from "@/lib/utils";

interface SectionShellProps {
  id?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionShell({
  id,
  title,
  description,
  action,
  children,
  className,
}: SectionShellProps) {
  return (
    <section id={id} className={cn("section-anchor space-y-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
