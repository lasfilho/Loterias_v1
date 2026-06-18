"use client";

import { useEffect, useState } from "react";
import { DisclaimerBanner, PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
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

export default function HistoricoPage() {
  const [game, setGame] = useState<GameSlug>("lotofacil");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const rules = GAMES[game];

  useEffect(() => {
    fetch(`/api/games/${game}/predictions/history?limit=30`)
      .then((r) => r.json())
      .then(setPredictions)
      .catch(() => setPredictions([]));
  }, [game]);

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
        {predictions.length === 0 ? (
          <Card className="glass">
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              Nenhum palpite salvo para {rules.name}.
            </CardContent>
          </Card>
        ) : (
          predictions.map((p) => (
            <Card key={p.id} className="glass">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {formatDate(p.createdAt)}
                  </CardTitle>
                  <div className="flex gap-2">
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DrawNumbers numbers={p.numbers} color={rules.color} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
