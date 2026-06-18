import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendBadgeProps {
  direction: "up" | "down" | "stable";
  label: string;
  className?: string;
}

export function TrendBadge({ direction, label, className }: TrendBadgeProps) {
  const Icon =
    direction === "up"
      ? ArrowUpRight
      : direction === "down"
        ? ArrowDownRight
        : ArrowRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        direction === "up" && "bg-success/10 text-success",
        direction === "down" && "bg-destructive/10 text-destructive",
        direction === "stable" && "bg-muted text-muted-foreground",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
