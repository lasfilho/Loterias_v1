"use client";

import { useEffect, useState } from "react";
import { Database, Loader2, RefreshCw } from "lucide-react";
import { DisclaimerBanner, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { GAMES, GAME_SLUGS, type GameSlug } from "@/modules/shared/constants";
import { cn, formatDate } from "@/lib/utils";

interface SyncLog {
  id: string;
  gameType: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  contestsAdded: number;
  contestsTotal: number;
  lastContestProcessed: number | null;
  errorMessage: string | null;
}

export default function ImportacaoPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState<GameSlug | null>(null);
  const [maxContests, setMaxContests] = useState("");

  const fetchLogs = async () => {
    const res = await fetch("/api/sync");
    if (res.ok) setLogs(await res.json());
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSync = async (game: GameSlug) => {
    setLoading(game);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game,
          maxContests: maxContests ? parseInt(maxContests) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Erro na sincronização");
      }
      await fetchLogs();
    } finally {
      setLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge variant="success">Sucesso</Badge>;
      case "PARTIAL":
        return <Badge variant="warning">Parcial</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Falhou</Badge>;
      case "RUNNING":
        return <Badge variant="warning">Em andamento</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const statusNoteClass = (status: string, message: string | null) => {
    if (!message) return "";
    if (status === "FAILED" || status === "PARTIAL") {
      return "text-destructive";
    }
    return "text-muted-foreground";
  };

  return (
    <div>
      <PageHeader
        title="Importação & Sincronização"
        description="Coleta de resultados históricos via API oficial da Caixa"
      />

      <DisclaimerBanner />

      <Card className="glass mt-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" /> Sincronizar por Modalidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-xs">
            <Label htmlFor="max">Limite de concursos (opcional)</Label>
            <Input
              id="max"
              type="number"
              placeholder="Ex: 100 (vazio = todos)"
              value={maxContests}
              onChange={(e) => setMaxContests(e.target.value)}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Em carga inicial: limita o último número de concurso. Em atualização
              incremental: quantidade máxima de concursos novos por execução.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {GAME_SLUGS.map((slug) => {
              const game = GAMES[slug];
              return (
                <div
                  key={slug}
                  className="rounded-xl border border-border p-5 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: game.color }}
                    >
                      {game.shortName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{game.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {game.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => handleSync(slug)}
                    disabled={loading !== null}
                    style={
                      loading === slug
                        ? undefined
                        : { background: game.color }
                    }
                  >
                    {loading === slug ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Sincronizar
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="glass mt-8">
        <CardHeader>
          <CardTitle className="text-base">Histórico de Sincronizações</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma sincronização realizada ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {statusBadge(log.status)}
                    <span className="text-sm font-medium">{log.gameType}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(log.startedAt)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    +{log.contestsAdded} concursos | Total: {log.contestsTotal}
                    {log.lastContestProcessed != null && (
                      <span className="ml-2">
                        até concurso {log.lastContestProcessed}
                      </span>
                    )}
                    {log.errorMessage && (
                      <span
                        className={cn(
                          "ml-2",
                          statusNoteClass(log.status, log.errorMessage)
                        )}
                      >
                        {log.errorMessage}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
