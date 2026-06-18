import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoBlockProps {
  title?: string;
  children: React.ReactNode;
  variant?: "default" | "muted" | "accent";
  className?: string;
}

export function InfoBlock({
  title,
  children,
  variant = "default",
  className,
}: InfoBlockProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-sm leading-relaxed",
        variant === "default" && "border-border bg-card/50",
        variant === "muted" && "border-border/60 bg-muted/40",
        variant === "accent" && "border-primary/20 bg-primary/5",
        className
      )}
    >
      {(title || variant === "accent") && (
        <div className="flex items-center gap-2 mb-2 text-foreground font-medium">
          <Info className="h-4 w-4 text-primary shrink-0" />
          {title ?? "Nota metodológica"}
        </div>
      )}
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}
