"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FlaskConical, Loader2, Play, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Label, Select, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  GAMES,
  GAME_SLUGS,
  type GameSlug,
} from "@/modules/shared/constants";
import {
  GENERATION_MODES,
  type GenerationMode,
} from "@/modules/shared/prediction/types";
import type { BacktestReport } from "@/modules/shared/backtest/types";
import { runBacktestApi, fetchBacktestHistory } from "@/lib/api-client";
import { InfoBlock } from "@/components/dashboard/info-block";
import { ErrorState } from "@/components/dashboard/error-state";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/dashboard/data-table";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import {
  HitBandComparisonChart,
  PeriodMeanHitsChart,
  ScoreCorrelationChart,
  StrategyRankingChart,
} from "@/components/charts/backtest-charts";
import { GENERATION_STRATEGIES } from "@/modules/shared/prediction/types";
import { formatDate } from "@/lib/utils";

export default function BacktestPage() {
  const searchParams = useSearchParams();
  const initialGame =
    (searchParams.get("game") as GameSlug) || "lotofacil";

  const [game, setGame] = useState<GameSlug>(
    GAME_SLUGS.includes(initialGame) ? initialGame : "lotofacil"
  );
  const [mode, setMode] = useState<GenerationMode>("BALANCED");
  const [windowSize, setWindowSize] = useState(50);
  const [trainMin, setTrainMin] = useState(80);
  const [fromContest, setFromContest] = useState("");
  const [toContest, setToContest] = useState("");
  const [save, setSave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<BacktestReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<
    Array<{ id: string; startedAt: string; status: string; contestsTested: number }>
  >([]);

  const rules = GAMES[game];

  const loadHistory = async () => {
    try {
      const data = await fetchBacktestHistory(game);
      setHistory(
        (data.runs as Array<{
          id: string;
          startedAt: string;
          status: string;
          contestsTested: number;
        }>) ?? []
      );
    } catch {
      setHistory([]);
    }
  };

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runBacktestApi(game, {
        mode,
        windowSize,
        trainMinDraws: trainMin,
        fromContest: fromContest ? Number(fromContest) : undefined,
        toContest: toContest ? Number(toContest) : undefined,
        persist: save,
        includeRandomBaseline: true,
      });
      setReport(data.report);
      if (save) loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao executar backtest");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setReport(null);
    loadHistory();
  }, [game]);

  const allStrategies = report
    ? [
        ...report.ranking,
        ...(report.baselineRandom ? [report.baselineRandom] : []),
      ]
    : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Backtest de Estratégias"
        description="Avaliação retrospectiva walk-forward — mede aderência histórica, não previsão futura"
      />

      <InfoBlock variant="accent">
        Backtest em loteria não prova capacidade preditiva. Cada concurso usa
        apenas dados anteriores (walk-forward). Resultados servem para comparar
        heurísticas no passado, não para garantir ganhos.
      </InfoBlock>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {loading ? (
            <DashboardSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={run} />
          ) : report ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {report.meta.contestsTested} concursos testados
                </Badge>
                <Badge variant="outline">
                  C{report.meta.fromContest}–C{report.meta.toContest}
                </Badge>
                <Badge variant="outline">
                  Modo{" "}
                  {GENERATION_MODES.find((m) => m.value === report.meta.mode)
                    ?.label ?? report.meta.mode}
                </Badge>
              </div>

              <DataTable
                columns={[
                  {
                    key: "rank",
                    header: "#",
                    render: (r) => (
                      <span className="font-bold tabular-nums">
                        {r.rank || "—"}
                      </span>
                    ),
                    className: "w-10",
                  },
                  {
                    key: "strategy",
                    header: "Estratégia",
                    render: (r) =>
                      GENERATION_STRATEGIES.find(
                        (s) => s.value === r.strategy
                      )?.label ??
                      (r.strategy === "RANDOM" ? "Aleatório" : r.strategy),
                  },
                  {
                    key: "mean",
                    header: "Média",
                    render: (r) => r.meanHits.toFixed(3),
                  },
                  {
                    key: "median",
                    header: "Mediana",
                    render: (r) => r.medianHits.toFixed(1),
                  },
                  {
                    key: "partial",
                    header: `≥${report.ranking[0]?.partialHitThreshold ?? "—"}`,
                    render: (r) => `${r.partialHitRate.toFixed(1)}%`,
                  },
                  {
                    key: "corr",
                    header: "Score×Acertos",
                    render: (r) =>
                      r.scoreCorrelation !== null
                        ? r.scoreCorrelation.toFixed(3)
                        : "—",
                  },
                  {
                    key: "streak",
                    header: "Seq. parcial máx.",
                    render: (r) => r.partialStreakStats.maxStreak,
                  },
                ]}
                data={allStrategies}
                keyExtractor={(r) => r.strategy}
              />

              <div className="grid gap-6 lg:grid-cols-2">
                <StrategyRankingChart
                  strategies={report.ranking}
                  color={rules.color}
                />
                <ScoreCorrelationChart strategies={allStrategies} />
              </div>

              <HitBandComparisonChart strategies={report.ranking.slice(0, 5)} />

              <PeriodMeanHitsChart
                strategies={report.ranking}
                color={rules.color}
              />
            </>
          ) : (
            <EmptyState
              title="Nenhum backtest executado"
              description="Configure os parâmetros e clique em Executar Backtest para comparar estratégias no histórico."
              icon="chart"
              actionLabel="Executar agora"
              onAction={run}
            />
          )}
        </div>

        <aside className="glass rounded-xl p-5 space-y-5 h-fit xl:sticky xl:top-8">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" style={{ color: rules.color }} />
            <h2 className="font-semibold text-sm">Configuração</h2>
          </div>

          <div>
            <Label className="text-xs">Modalidade</Label>
            <Select
              value={game}
              onChange={(e) => setGame(e.target.value as GameSlug)}
              className="mt-1.5"
            >
              {GAME_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {GAMES[slug].name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label className="text-xs">Modo de geração</Label>
            <Select
              value={mode}
              onChange={(e) => setMode(e.target.value as GenerationMode)}
              className="mt-1.5"
            >
              {GENERATION_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Janela</Label>
              <Input
                type="number"
                value={windowSize}
                onChange={(e) => setWindowSize(Number(e.target.value))}
                className="mt-1.5 h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Mín. treino</Label>
              <Input
                type="number"
                value={trainMin}
                onChange={(e) => setTrainMin(Number(e.target.value))}
                className="mt-1.5 h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Concurso de</Label>
              <Input
                placeholder="opcional"
                value={fromContest}
                onChange={(e) => setFromContest(e.target.value)}
                className="mt-1.5 h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Concurso até</Label>
              <Input
                placeholder="opcional"
                value={toContest}
                onChange={(e) => setToContest(e.target.value)}
                className="mt-1.5 h-9"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={save}
              onChange={(e) => setSave(e.target.checked)}
              className="rounded"
            />
            Salvar resultado no banco
          </label>

          <Button
            onClick={run}
            disabled={loading}
            className="w-full gap-2"
            style={{ background: rules.color }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : save ? (
              <Save className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Executar backtest
          </Button>

          {history.length > 0 && (
            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Histórico salvo
              </p>
              {history.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  className="text-xs flex justify-between text-muted-foreground"
                >
                  <span>{formatDate(h.startedAt)}</span>
                  <span>{h.contestsTested} conc.</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
