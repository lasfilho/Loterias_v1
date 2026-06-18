import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variant === "default" && "bg-primary/20 text-primary",
        variant === "secondary" && "bg-muted text-muted-foreground",
        variant === "outline" && "border border-border text-foreground",
        variant === "success" && "bg-emerald-500/20 text-emerald-400",
        variant === "warning" && "bg-amber-500/20 text-amber-400",
        variant === "destructive" && "bg-red-500/20 text-red-400",
        className
      )}
      {...props}
    />
  );
}
