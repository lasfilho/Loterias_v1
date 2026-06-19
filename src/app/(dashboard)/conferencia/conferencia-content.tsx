"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Download,
  Loader2,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { DisclaimerBanner, PageHeader } from "@/components/layout/page-header";
import { ConferenceWeekBoard } from "@/components/domain/conference-week-board";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GAMES, GAME_SLUGS, type GameSlug } from "@/modules/shared/constants";
import type { ConferenceWeekView } from "@/modules/shared/weekly-bet/types";
import { formatWeekLabel, getBetWeekStart, toDateKey } from "@/modules/shared/weekly-bet/week-utils";
import { MAX_BET_COUNT } from "@/modules/shared/weekly-bet/constants";
import { subWeeks } from "date-fns";
import { getGameTheme } from "@/lib/game-theme";
import { cn } from "@/lib/utils";

const TAB_TRIGGER_BASE =
  "flex-1 min-w-[100px] gap-2 py-2.5 border-2 border-transparent rounded-lg font-medium text-muted-foreground opacity-75 hover:opacity-100 transition-all";

const TAB_ACTIVE_CLASSES: Record<GameSlug, string> = {
  lotofacil:
    "data-[state=active]:opacity-100 data-[state=active]:font-bold data-[state=active]:border-violet-300 data-[state=active]:bg-violet-300/12 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-200 data-[state=active]:shadow-[0_2px_12px_rgba(196,181,253,0.2)]",
  megasena:
    "data-[state=active]:opacity-100 data-[state=active]:font-bold data-[state=active]:border-emerald-300 data-[state=active]:bg-emerald-300/12 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-200 data-[state=active]:shadow-[0_2px_12px_rgba(134,239,172,0.2)]",
  quina:
    "data-[state=active]:opacity-100 data-[state=active]:font-bold data-[state=active]:border-sky-300 data-[state=active]:bg-sky-300/12 data-[state=active]:text-sky-600 dark:data-[state=active]:text-sky-200 data-[state=active]:shadow-[0_2px_12px_rgba(125,211,252,0.2)]",
};

function buildWeekOptions(count = 12) {
  const current = getBetWeekStart();
  return Array.from({ length: count }, (_, i) => {
    const start = subWeeks(current, i);
    const key = toDateKey(start);
    return { key, label: formatWeekLabel(start) };
  });
}

function SummaryKpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function TabPanel({
  game,
  weekStart,
  minHits,
}: {
  game: GameSlug;
  weekStart: string;
  minHits: number;
}) {
  const [conference, setConference] = useState<ConferenceWeekView | null>(null);
  const theme = getGameTheme(game);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [updatingBetCount, setUpdatingBetCount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/conferencia?game=${game}&weekStart=${weekStart}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erro ao carregar conferência");
      }
      setConference(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
      setConference(null);
    } finally {
      setLoading(false);
    }
  }, [game, weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  const syncResults = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/conferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, weekStart }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erro ao buscar resultados");
      }
      const data = await res.json();
      setConference(data.conference ?? data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao sincronizar");
    } finally {
      setSyncing(false);
    }
  };

  const markReviewed = async () => {
    try {
      const res = await fetch("/api/conferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review", game, weekStart }),
      });
      if (res.ok) setConference(await res.json());
    } catch {
      /* ignore */
    }
  };

  const assignBet = async (
    weekday: number,
    betSlot: number,
    predictionId: string
  ) => {
    setAssigning(true);
    setError(null);
    try {
      const res = await fetch("/api/conferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          game,
          weekStart,
          weekday,
          betSlot,
          predictionId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erro ao atribuir jogo");
      }
      setConference(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atribuir jogo");
    } finally {
      setAssigning(false);
    }
  };

  const changeBetCount = async (next: number) => {
    if (!conference || next < 1 || next > MAX_BET_COUNT) return;

    setUpdatingBetCount(true);
    setError(null);
    try {
      const res = await fetch("/api/conferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setBetCount",
          game,
          weekStart,
          betCount: next,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erro ao atualizar quantidade");
      }
      setConference(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar quantidade");
    } finally {
      setUpdatingBetCount(false);
    }
  };

  const exportConference = () => {
    if (!conference) return;
    const blob = new Blob([JSON.stringify(conference, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conferencia-${game}-${weekStart}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredDays = useMemo(() => {
    if (!conference) return [];
    if (minHits <= 0) return conference.days;
    return conference.days
      .map((day) => ({
        ...day,
        checks: day.checks.filter(
          (c) => c.assigned && c.hits !== null && c.hits >= minHits
        ),
      }))
      .filter((day) => day.checks.length > 0);
  }, [conference, minHits]);

  const displayConference = useMemo(() => {
    if (!conference) return null;
    if (minHits <= 0) return conference;
    return { ...conference, days: filteredDays };
  }, [conference, filteredDays, minHits]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Carregando conferência...</p>
      </div>
    );
  }

  if (error && !conference) {
    return (
      <Card className="glass border-destructive/30">
        <CardContent className="py-12 text-center space-y-4">
          <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={load} className={theme.outlineButton}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!conference) {
    return null;
  }

  const s = conference.summary;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Label htmlFor="bet-count" className="text-sm text-muted-foreground shrink-0">
            Jogos na semana
          </Label>
          <Select
            id="bet-count"
            value={String(conference.betCount)}
            onChange={(e) => changeBetCount(Number(e.target.value))}
            disabled={updatingBetCount}
            className="w-20"
          >
            {Array.from({ length: MAX_BET_COUNT }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            cada jogo repete em todos os dias de sorteio
          </span>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={syncResults}
          disabled={syncing}
          className={theme.outlineButton}
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Conferir resultados
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={exportConference}
          className={theme.outlineButton}
        >
          <Download className="h-4 w-4" />
          Exportar
        </Button>
        {!conference.reviewed && (
          <Button
            variant="outline"
            size="sm"
            onClick={markReviewed}
            className={theme.outlineButton}
          >
            <CheckCircle2 className="h-4 w-4" />
            Marcar semana conferida
          </Button>
        )}
        {conference.reviewed && (
          <Badge variant="success" className="gap-1 py-1.5 px-3">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Semana conferida
          </Badge>
        )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryKpi label="Jogos salvos" value={s.totalBets} />
        <SummaryKpi
          label="Cartões preenchidos"
          value={`${s.assignedSlots}/${s.totalSlots}`}
          hint={
            s.awaitingSlots > 0
              ? `${s.checkedSlots} conferidos · ${s.awaitingSlots} aguardando publicação da Caixa`
              : `${s.checkedSlots} conferidos`
          }
        />
        <SummaryKpi
          label="Máx. acertos"
          value={s.maxHits}
          hint={s.bestBetLabel ?? undefined}
        />
        <SummaryKpi
          label="Faixa premiável"
          value={s.prizeEligibleCount}
          hint={`${s.totalHits} acertos acumulados`}
        />
      </div>

      {s.prizeEligibleCount > 0 && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 flex items-center gap-3",
            theme.comparisonPanelBg
          )}
        >
          <Trophy className={cn("h-5 w-5 shrink-0", theme.prizeHits)} />
          <p className="text-sm">
            <span className="font-semibold">{s.prizeEligibleCount}</span>{" "}
            conferência(s) atingiram faixa premiável nesta semana.
          </p>
        </div>
      )}

      {displayConference && (
        <ConferenceWeekBoard
          conference={displayConference}
          onAssign={assignBet}
          assigning={assigning}
        />
      )}

      {minHits > 0 && filteredDays.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Nenhum cartão com {minHits}+ acertos nesta semana.
        </p>
      )}
    </div>
  );
}

export default function ConferenciaContent() {
  const [weekStart, setWeekStart] = useState(() => toDateKey(getBetWeekStart()));
  const [minHits, setMinHits] = useState(0);
  const [activeGame, setActiveGame] = useState<GameSlug>("lotofacil");
  const weekOptions = useMemo(() => buildWeekOptions(), []);

  return (
    <div>
      <PageHeader
        title="Conferência Semanal"
        description="Compare seus jogos salvos com os sorteios oficiais — ciclo semanal a partir do sábado"
      />

      <DisclaimerBanner />

      <Card className="glass mt-8">
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="week-select">Semana da aposta</Label>
              <Select
                id="week-select"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="mt-1.5"
              >
                {weekOptions.map((w) => (
                  <option key={w.key} value={w.key}>
                    {w.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Rotina semanal: jogos salvos no sábado cobrem os sorteios da
                semana.
              </p>
            </div>
            <div>
              <Label htmlFor="min-hits">Filtro mín. acertos</Label>
              <Select
                id="min-hits"
                value={String(minHits)}
                onChange={(e) => setMinHits(Number(e.target.value))}
                className="mt-1.5"
              >
                <option value="0">Todos os jogos</option>
                <option value="11">Lotofácil: 11+</option>
                <option value="12">Lotofácil: 12+</option>
                <option value="4">Mega/Quina: 4+</option>
                <option value="5">Mega/Quina: 5+</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeGame}
        onValueChange={(v) => setActiveGame(v as GameSlug)}
        className="mt-8"
      >
        <TabsList className="w-full flex-wrap h-auto gap-2 p-2 bg-muted/40">
          {GAME_SLUGS.map((slug) => (
            <TabsTrigger
              key={slug}
              value={slug}
              className={cn(TAB_TRIGGER_BASE, TAB_ACTIVE_CLASSES[slug])}
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full shrink-0 transition-transform",
                  activeGame === slug && "scale-125 ring-2 ring-offset-1 ring-offset-background"
                )}
                style={{
                  background: GAMES[slug].color,
                  ...(activeGame === slug
                    ? { boxShadow: `0 0 8px ${GAMES[slug].color}` }
                    : {}),
                }}
              />
              {GAMES[slug].shortName}
            </TabsTrigger>
          ))}
        </TabsList>

        {GAME_SLUGS.map((slug) => (
          <TabsContent key={slug} value={slug} className="mt-6">
            <TabPanel game={slug} weekStart={weekStart} minHits={minHits} />
          </TabsContent>
        ))}
      </Tabs>

      <Card className="glass mt-8 border-dashed">
        <CardContent className="py-4 text-xs text-muted-foreground space-y-2">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <ClipboardList className="h-4 w-4" />
            Como usar
          </p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>
              Escolha <strong>Jogos na semana</strong> (1 a 5) — cada jogo
              aparece em pilha em todos os dias de sorteio.
            </li>
            <li>
              Toque em cada mini cartão e escolha um jogo salvo da semana.
            </li>
            <li>
              Clique em <strong>Conferir resultados</strong> para buscar
              sorteios oficiais e calcular acertos.
            </li>
            <li>
              Sorteios em feriados podem não ocorrer — o status ficará como
              &quot;Resultado indisponível&quot;.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
