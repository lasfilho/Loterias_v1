"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { DisclaimerBanner, PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DrawNumbers } from "@/components/domain/number-ball";
import {
  GAMES,
  GAME_SLUGS,
  PREDICTION_STRATEGIES,
  type GameSlug,
} from "@/modules/shared/constants";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

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
        <Label>Modalidade</Label>
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

      <div className="grid gap-4 mt-6">
        {loading ? (
          <Card className="glass">
            <CardContent className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : predictions.length === 0 ? (
          <Card className="glass">
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              Nenhum palpite salvo para {rules.name}.
            </CardContent>
          </Card>
        ) : (
          predictions.map((p) => (
            <Card key={p.id} className="glass">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-sm font-medium">
                    {formatDate(p.createdAt)}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Badge variant="outline">
                      {PREDICTION_STRATEGIES.find(
                        (s) => s.value === p.strategy
                      )?.label ?? p.strategy}
                    </Badge>
                    {p.confidence && (
                      <Badge variant="secondary">
                        {(p.confidence * 100).toFixed(0)}%
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(p)}
                      disabled={deletingId === p.id}
                      className={deleteButtonClass}
                    >
                      {deletingId === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DrawNumbers numbers={p.numbers} color={rules.color} />
                {p.notes && (
                  <p className="text-xs text-muted-foreground mt-3">{p.notes}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
