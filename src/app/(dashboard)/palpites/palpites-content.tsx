"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GitCompare, Loader2, Sparkles } from "lucide-react";
import { DisclaimerBanner, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { DrawNumbers } from "@/components/domain/number-ball";
import { GAMES, GAME_SLUGS, type GameSlug } from "@/modules/shared/constants";
import { Badge } from "@/components/ui/badge";
import {
  GENERATION_MODES,
  GENERATION_STRATEGIES,
  type GenerationMode,
  type GenerationStrategy,
} from "@/modules/shared/prediction/types";

type PredictionView = {
  numbers: number[];
  confidence: number;
  score?: number;
  strategy: string;
  strategyDetail?: string;
  mode?: string;
  explanation?: string;
  hash?: string;
  timestamp?: string;
  metadata: Record<string, unknown>;
  id?: string;
};

type CompareView = {
  strategy: GenerationStrategy;
  prediction: PredictionView;
}[];

export default function PalpitesPage() {
  const searchParams = useSearchParams();
  const initialGame = (searchParams.get("game") as GameSlug) || "lotofacil";

  const [game, setGame] = useState<GameSlug>(
    GAME_SLUGS.includes(initialGame) ? initialGame : "lotofacil"
  );
  const [strategy, setStrategy] = useState<GenerationStrategy>("HYBRID");
  const [mode, setMode] = useState<GenerationMode>("BALANCED");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionView | null>(null);
  const [batch, setBatch] = useState<PredictionView[] | null>(null);
  const [comparison, setComparison] = useState<CompareView | null>(null);

  const rules = GAMES[game];

  const resetResults = () => {
    setResult(null);
    setBatch(null);
    setComparison(null);
  };

  const generate = async (save = false, batchSize = 1) => {
    setLoading(true);
    resetResults();
    try {
      const res = await fetch(`/api/games/${game}/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy,
          mode,
          save,
          batchSize: batchSize > 1 ? batchSize : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.batch?.predictions) {
          setBatch(data.batch.predictions);
        } else {
          setResult(data);
        }
      } else {
        const err = await res.json();
        alert(err.error ?? "Erro ao gerar palpite");
      }
    } finally {
      setLoading(false);
    }
  };

  const compareStrategies = async () => {
    setLoading(true);
    resetResults();
    try {
      const res = await fetch(`/api/games/${game}/predictions/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (res.ok) {
        const data = await res.json();
        setComparison(data.comparison ?? []);
      } else {
        const err = await res.json();
        alert(err.error ?? "Erro ao comparar estratégias");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    resetResults();
  }, [game, strategy, mode]);

  const strategyLabel = (value: string) =>
    GENERATION_STRATEGIES.find((s) => s.value === value || s.prisma === value)
      ?.label ?? value;

  return (
    <div>
      <PageHeader
        title="Geração de Palpites"
        description="Palpites orientados por modelos estatísticos — sem garantia de acerto"
      />

      <DisclaimerBanner />

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <Card className="glass lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
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

            <div>
              <Label>Modo</Label>
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
              <p className="text-xs text-muted-foreground mt-1">
                {GENERATION_MODES.find((m) => m.value === mode)?.description}
              </p>
            </div>

            <div>
              <Label>Estratégia</Label>
              <Select
                value={strategy}
                onChange={(e) =>
                  setStrategy(e.target.value as GenerationStrategy)
                }
                className="mt-1.5"
              >
                {GENERATION_STRATEGIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {
                  GENERATION_STRATEGIES.find((s) => s.value === strategy)
                    ?.description
                }
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => generate(false)}
                disabled={loading}
                className="gap-2"
                style={{ background: rules.color }}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Gerar Palpite
              </Button>
              <Button
                variant="outline"
                onClick={() => generate(true)}
                disabled={loading}
              >
                Gerar e Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => generate(false, 3)}
                disabled={loading}
              >
                Gerar Lote (3)
              </Button>
              <Button
                variant="outline"
                onClick={compareStrategies}
                disabled={loading}
                className="gap-2"
              >
                <GitCompare className="h-4 w-4" />
                Comparar Estratégias
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            {comparison ? (
              <div className="space-y-6">
                {comparison.map((item) => (
                  <div
                    key={item.strategy}
                    className="border-b border-border/50 pb-4 last:border-0"
                  >
                    <p className="text-sm font-medium mb-2">
                      {strategyLabel(item.strategy)}
                    </p>
                    <DrawNumbers
                      numbers={item.prediction.numbers}
                      color={rules.color}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {item.prediction.explanation}
                    </p>
                  </div>
                ))}
              </div>
            ) : batch ? (
              <div className="space-y-8">
                {batch.map((p, i) => (
                  <div key={p.hash ?? i}>
                    <p className="text-sm font-medium mb-2">Palpite {i + 1}</p>
                    <DrawNumbers numbers={p.numbers} color={rules.color} />
                    <p className="text-xs text-muted-foreground mt-2">
                      {p.explanation}
                    </p>
                  </div>
                ))}
              </div>
            ) : result ? (
              <div className="space-y-6">
                <DrawNumbers numbers={result.numbers} color={rules.color} />
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary">
                    Score: {((result.score ?? result.confidence) * 100).toFixed(0)}%
                  </Badge>
                  <Badge variant="outline">
                    {strategyLabel(result.strategyDetail ?? result.strategy)}
                  </Badge>
                  {result.mode && (
                    <Badge variant="outline">
                      {GENERATION_MODES.find((m) => m.value === result.mode)
                        ?.label ?? result.mode}
                    </Badge>
                  )}
                  {result.id && (
                    <Badge variant="success">Salvo no histórico</Badge>
                  )}
                </div>
                {result.explanation && (
                  <p className="text-sm text-muted-foreground">
                    {result.explanation}
                  </p>
                )}
                {result.metadata && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      Base: {String(result.metadata.totalDraws ?? 0)} concursos
                      analisados
                    </p>
                    {result.hash && <p>ID: {result.hash}</p>}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  Configure modalidade, modo e estratégia, depois clique em
                  Gerar Palpite.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
