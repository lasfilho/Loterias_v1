"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Trophy,
  Clock,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GAMES } from "@/modules/shared/constants";
import { getGameTheme } from "@/lib/game-theme";
import type { ConferenceCheckView } from "@/modules/shared/weekly-bet/types";
import { getCheckStatusMessage } from "@/modules/shared/weekly-bet/status-messages";
import {
  ComparisonLegend,
  ComparisonNumberGrid,
} from "./comparison-number-grid";
import { cn } from "@/lib/utils";

interface BetComparisonCardProps {
  check: ConferenceCheckView;
  game: keyof typeof GAMES;
  animateReveal?: boolean;
}

const STATUS_CONFIG: Record<
  ConferenceCheckView["status"],
  { label: string; variant: "secondary" | "warning" | "success" | "destructive" | "outline" }
> = {
  unassigned: { label: "Escolher jogo", variant: "outline" },
  checked: { label: "Conferido", variant: "success" },
  awaiting: { label: "Aguardando Caixa", variant: "warning" },
  future: { label: "Sorteio futuro", variant: "outline" },
  not_found: { label: "Sem resultado oficial", variant: "secondary" },
};

export function BetComparisonCard({
  check,
  game,
  animateReveal = false,
}: BetComparisonCardProps) {
  const [expanded, setExpanded] = useState(false);
  const rules = GAMES[game];
  const theme = getGameTheme(game);
  const status = STATUS_CONFIG[check.status];

  return (
    <Card className="glass overflow-hidden transition-shadow hover:shadow-lg">
      <div
        className="h-1.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${rules.color}, ${check.isPrizeEligible ? "#10b981" : "#94a3b8"})`,
        }}
      />
      <CardHeader className="pb-3 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Jogo {check.betSlot}
              {check.contestNumber ? ` · Concurso ${check.contestNumber}` : ""}
            </p>
            <p className="font-semibold text-sm mt-0.5">
              {check.weekdayLabel}
              {check.drawDate
                ? ` · ${new Date(check.drawDate).toLocaleDateString("pt-BR")}`
                : ` · ${new Date(check.expectedDate + "T12:00:00").toLocaleDateString("pt-BR")}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            <Badge variant={status.variant}>{status.label}</Badge>
            {check.hits !== null && (
              <Badge
                variant={check.isPrizeEligible ? "success" : "secondary"}
                className="gap-1 font-bold"
              >
                {check.isPrizeEligible && <Trophy className="h-3 w-3" />}
                {check.hits} acertos
              </Badge>
            )}
            {check.prizeBand && (
              <Badge variant="outline">{check.prizeBand}</Badge>
            )}
          </div>
        </div>

        {check.status === "checked" && (
          <div
            className={cn(
              "rounded-xl p-3 border",
              theme.comparisonPanelBg
            )}
          >
            <ComparisonNumberGrid
              minNumber={rules.minNumber}
              maxNumber={rules.maxNumber}
              betNumbers={check.betNumbers}
              drawNumbers={check.drawNumbers}
              game={game}
              animateReveal={animateReveal}
              size="compact"
            />
            <ComparisonLegend className="mt-3 justify-center" game={game} />
          </div>
        )}

        {check.status === "awaiting" && (
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 py-4 justify-center text-center px-2">
            <Clock className="h-4 w-4 shrink-0" />
            {check.statusMessage ?? getCheckStatusMessage("awaiting")}
          </div>
        )}

        {check.status === "future" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center text-center px-2">
            <Calendar className="h-4 w-4 shrink-0" />
            {check.statusMessage ?? getCheckStatusMessage("future")}
          </div>
        )}

        {check.status === "not_found" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center text-center px-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {check.statusMessage ?? getCheckStatusMessage("not_found")}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-1 text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" /> Ocultar detalhes
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" /> Ver detalhes
            </>
          )}
        </Button>

        {expanded && (
          <div className="mt-3 space-y-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
            <p>
              <span className="font-medium text-foreground">Estratégia:</span>{" "}
              {check.strategyDetail ?? check.strategy}
            </p>
            <p>
              <span className="font-medium text-foreground">Suas dezenas:</span>{" "}
              {check.betNumbers.map((n) => String(n).padStart(2, "0")).join(" · ")}
            </p>
            {check.drawNumbers.length > 0 && (
              <p>
                <span className="font-medium text-foreground">Sorteadas:</span>{" "}
                {check.drawNumbers.map((n) => String(n).padStart(2, "0")).join(" · ")}
              </p>
            )}
            {check.matchedNumbers.length > 0 && (
              <p className={cn("font-medium", theme.prizeHits)}>
                Coincidências:{" "}
                {check.matchedNumbers.map((n) => String(n).padStart(2, "0")).join(" · ")}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DaySectionProps {
  weekdayLabel: string;
  expectedDate: string;
  checks: ConferenceCheckView[];
  game: keyof typeof GAMES;
}

export function ConferenceDaySection({
  weekdayLabel,
  expectedDate,
  checks,
  game,
}: DaySectionProps) {
  const dateLabel = new Date(expectedDate + "T12:00:00").toLocaleDateString(
    "pt-BR",
    { weekday: "long", day: "2-digit", month: "short" }
  );

  const dayStatus = checks.every((c) => c.status === "checked")
    ? "checked"
    : checks.some((c) => c.status === "checked")
      ? "partial"
      : checks[0]?.status ?? "awaiting";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-base capitalize">{weekdayLabel}</h3>
          <p className="text-xs text-muted-foreground capitalize">{dateLabel}</p>
        </div>
        <Badge
          variant={
            dayStatus === "checked"
              ? "success"
              : dayStatus === "partial"
                ? "warning"
                : "outline"
          }
        >
          {checks.length} {checks.length === 1 ? "jogo" : "jogos"}
        </Badge>
      </div>

      <div
        className={cn(
          "grid gap-4",
          checks.length > 1 ? "md:grid-cols-2" : "grid-cols-1"
        )}
      >
        {checks.map((check) => (
          <BetComparisonCard key={`${check.predictionId}-${check.weekday}`} check={check} game={game} />
        ))}
      </div>
    </section>
  );
}
