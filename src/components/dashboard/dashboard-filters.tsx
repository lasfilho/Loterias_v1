"use client";

import { Filter, PanelRightClose, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { DashboardFilters } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface DashboardFiltersPanelProps {
  draft: DashboardFilters;
  setDraft: (next: DashboardFilters) => void;
  onApply: () => void;
  onReset: () => void;
  activeCount: number;
  accent?: string;
  className?: string;
  onCollapse?: () => void;
}

export function DashboardFiltersPanel({
  draft,
  setDraft,
  onApply,
  onReset,
  activeCount,
  accent,
  className,
  onCollapse,
}: DashboardFiltersPanelProps) {
  return (
    <aside
      className={cn(
        "glass rounded-xl p-5 space-y-5 h-fit xl:sticky xl:top-8",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: accent
                ? `color-mix(in srgb, ${accent} 18%, transparent)`
                : "var(--muted)",
            }}
          >
            <SlidersHorizontal
              className="h-4 w-4"
              style={{ color: accent }}
            />
          </div>
          <div>
            <p className="text-sm font-semibold">Filtros</p>
            <p className="text-[11px] text-muted-foreground">
              {activeCount > 0
                ? `${activeCount} filtro(s) ativo(s)`
                : "Amostra completa"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {activeCount > 0 && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: accent
                  ? `color-mix(in srgb, ${accent} 15%, transparent)`
                  : "var(--muted)",
                color: accent,
              }}
            >
              {activeCount}
            </span>
          )}
          {onCollapse && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onCollapse}
              aria-label="Ocultar filtros"
              title="Ocultar filtros"
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs">Concurso inicial</Label>
          <Input
            type="number"
            placeholder="Ex: 1"
            value={draft.fromContest ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                fromContest: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
              })
            }
            className="mt-1.5 h-9"
          />
        </div>
        <div>
          <Label className="text-xs">Concurso final</Label>
          <Input
            type="number"
            placeholder="Ex: 3000"
            value={draft.toContest ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                toContest: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
              })
            }
            className="mt-1.5 h-9"
          />
        </div>
        <div>
          <Label className="text-xs">Limite de concursos</Label>
          <Input
            type="number"
            placeholder="500"
            value={draft.limit ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                limit: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            className="mt-1.5 h-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <Button
          onClick={onApply}
          className="gap-2 w-full"
          style={accent ? { background: accent } : undefined}
        >
          <Filter className="h-4 w-4" />
          Aplicar filtros
        </Button>
        <Button variant="outline" onClick={onReset} className="gap-2 w-full">
          <RotateCcw className="h-4 w-4" />
          Limpar
        </Button>
      </div>

      <InfoBlockCompact />
    </aside>
  );
}

function InfoBlockCompact() {
  return (
    <p className="text-[11px] leading-relaxed text-muted-foreground border-t border-border pt-4">
      Filtros recalculam indicadores, gráficos e backtests sobre a janela
      selecionada. Não alteram resultados oficiais.
    </p>
  );
}
