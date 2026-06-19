"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { DisclaimerBanner, PageHeader } from "@/components/layout/page-header";
import { GameModalitySelect } from "@/components/domain/game-modality-select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PredictionVolanteCard } from "@/components/domain/prediction-volante-card";
import {
  GAMES,
  PREDICTION_STRATEGIES,
  type GameSlug,
} from "@/modules/shared/constants";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";
import {
  getVolanteListContainerClass,
  getVolanteListItemClass,
} from "@/components/domain/volante-layout";

interface Prediction {
  id: string;
  numbers: number[];
  strategy: string;
  confidence: number | null;
  notes: string | null;
  createdAt: string;
}

const deleteButtonClass =
  "gap-1.5 border border-border bg-transparent text-muted-foreground shadow-none hover:bg-destructive hover:text-white hover:border-destructive active:scale-[0.98] transition-all";

export default function HistoricoPage() {
  const [game, setGame] = useState<GameSlug>("lotofacil");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const rules = GAMES[game];

  const loadPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${game}/predictions/history?limit=30`);
      if (res.ok) {
        setPredictions(await res.json());
      } else {
        setPredictions([]);
      }
    } catch {
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, [game]);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  const handleDelete = async (prediction: Prediction) => {
    const confirmed = window.confirm(
      `Excluir este palpite salvo em ${formatDate(prediction.createdAt)}?\n\nEsta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setDeletingId(prediction.id);
    try {
      const res = await fetch(`/api/games/${game}/predictions/${prediction.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPredictions((prev) => prev.filter((p) => p.id !== prediction.id));
      } else {
        const err = await res.json();
        alert(err.error ?? "Erro ao excluir palpite");
      }
    } catch {
      alert("Erro ao excluir palpite");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Histórico de Palpites"
        description="Palpites gerados e salvos anteriormente"
      />

      <DisclaimerBanner />

      <div className="mt-8 max-w-xs">
        <GameModalitySelect
          id="historico-game"
          value={game}
          onChange={setGame}
        />
      </div>

      <div className={cn(getVolanteListContainerClass(game), "mt-6")}>
        {loading ? (
          <Card className="glass w-full">
            <CardContent className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : predictions.length === 0 ? (
          <Card className="glass w-full">
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              Nenhum palpite salvo para {rules.name}.
            </CardContent>
          </Card>
        ) : (
          <>
            {predictions.map((p) => {
              const strategyLabel =
                PREDICTION_STRATEGIES.find((s) => s.value === p.strategy)
                  ?.label ?? p.strategy;

              return (
                <div key={p.id} className={getVolanteListItemClass(game)}>
                  <PredictionVolanteCard
                    game={game}
                    numbers={p.numbers}
                    title={formatDate(p.createdAt)}
                    headerActions={
                      <>
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 font-normal"
                        >
                          {strategyLabel}
                        </Badge>
                        {p.confidence != null && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            {(p.confidence * 100).toFixed(0)}%
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p.id}
                          className={cn(deleteButtonClass, "h-6 text-[9px] px-2")}
                        >
                          {deletingId === p.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Excluir
                        </Button>
                      </>
                    }
                  />
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
