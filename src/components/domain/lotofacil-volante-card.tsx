"use client";

import {
  countLotofacilFrameCore,
  isBalancedFrameCoreSplit,
  isLotofacilFrameNumber,
  LOTOFACIL_GRID_SIZE,
} from "@/modules/lotofacil/volante.constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type LotofacilVolanteCardSize = "default" | "compact" | "mini";

interface LotofacilVolanteCardProps {
  selectedNumbers?: number[];
  color?: string;
  title?: string;
  /** @deprecated use size="compact" */
  compact?: boolean;
  size?: LotofacilVolanteCardSize;
  showHeader?: boolean;
  showBalance?: boolean;
  className?: string;
}

const SIZE_STYLES: Record<
  LotofacilVolanteCardSize,
  {
    header: string;
    headerPad: string;
    bodyPad: string;
    cell: string;
    gap: string;
    maxW: string;
    badge: string;
  }
> = {
  default: {
    header: "text-lg",
    headerPad: "px-4 py-2.5",
    bodyPad: "p-5",
    cell: "text-sm",
    gap: "gap-1.5",
    maxW: "max-w-[280px]",
    badge: "text-xs",
  },
  compact: {
    header: "text-sm",
    headerPad: "px-3 py-2",
    bodyPad: "p-4",
    cell: "text-xs",
    gap: "gap-1.5",
    maxW: "max-w-[240px]",
    badge: "text-[10px]",
  },
  mini: {
    header: "text-[10px]",
    headerPad: "px-2 py-1",
    bodyPad: "p-2",
    cell: "text-[10px] sm:text-[11px]",
    gap: "gap-0.5",
    maxW: "w-full",
    badge: "text-[9px] px-1.5 py-0",
  },
};

export function LotofacilVolanteCard({
  selectedNumbers = [],
  color = "#7c3aed",
  title = "LOTOFÁCIL",
  compact = false,
  size: sizeProp,
  showHeader = true,
  showBalance = true,
  className,
}: LotofacilVolanteCardProps) {
  const size: LotofacilVolanteCardSize =
    sizeProp ?? (compact ? "compact" : "default");
  const styles = SIZE_STYLES[size];

  const selected = new Set(selectedNumbers);
  const cells = Array.from({ length: 25 }, (_, i) => i + 1);
  const balance =
    showBalance && selectedNumbers.length > 0
      ? countLotofacilFrameCore(selectedNumbers)
      : null;
  const isBalanced =
    balance !== null &&
    isBalancedFrameCoreSplit(balance.frameCount, balance.coreCount);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border shadow-sm",
        styles.maxW,
        className
      )}
    >
      {showHeader && (
        <div
          className={cn(
            "flex items-center justify-center",
            styles.headerPad
          )}
          style={{
            background: `linear-gradient(135deg, ${color} 0%, #a855f7 100%)`,
          }}
        >
          <span
            className={cn(
              "font-black italic tracking-wide text-white uppercase truncate",
              styles.header
            )}
          >
            {title}
          </span>
        </div>
      )}

      <div className={cn(styles.bodyPad, "bg-transparent")}>
        <div
          className={cn("grid mx-auto w-full", styles.gap)}
          style={{
            gridTemplateColumns: `repeat(${LOTOFACIL_GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {cells.map((n) => {
            const isSelected = selected.has(n);
            const isFrame = isLotofacilFrameNumber(n);

            return (
              <div
                key={n}
                className={cn(
                  "aspect-square rounded-sm flex items-center justify-center font-extrabold tabular-nums border transition-colors",
                  styles.cell,
                  size === "mini" ? "border" : "border",
                  isSelected
                    ? "shadow-sm"
                    : isFrame
                      ? "bg-transparent border-red-300/50 text-muted-foreground"
                      : "bg-transparent border-dashed border-red-200/40 text-muted-foreground/70"
                )}
                style={
                  isSelected
                    ? {
                        background: `linear-gradient(135deg, ${color}33, ${color}14)`,
                        borderColor: `${color}48`,
                        color,
                      }
                    : undefined
                }
                title={
                  isSelected
                    ? "Marcada"
                    : isFrame
                      ? "Moldura"
                      : "Centro"
                }
              >
                {String(n).padStart(2, "0")}
              </div>
            );
          })}
        </div>

        {balance && (
          <div
            className={cn(
              "mt-2 flex flex-wrap items-center justify-center gap-1",
              size === "mini" && "mt-1.5"
            )}
          >
            <Badge
              variant="outline"
              className={cn("bg-white/80", styles.badge)}
            >
              M:{balance.frameCount}
            </Badge>
            <Badge
              variant="outline"
              className={cn("bg-white/80", styles.badge)}
            >
              C:{balance.coreCount}
            </Badge>
            {size !== "mini" && (
              <Badge
                variant={isBalanced ? "success" : "secondary"}
                className={styles.badge}
              >
                {isBalanced ? "9–10 / 5–6 ✓" : "Fora da faixa"}
              </Badge>
            )}
          </div>
        )}

        {selectedNumbers.length === 0 && size !== "mini" && (
          <div className="mt-3 flex flex-wrap gap-3 justify-center text-[10px] text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border-2 border-red-300/70 bg-white" />
              Moldura
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-red-200/50 bg-white/80" />
              Centro
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
