"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Save, Sparkles } from "lucide-react";
import { DisclaimerBanner, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameModalitySelect } from "@/components/domain/game-modality-select";
import { Label, Select } from "@/components/ui/input";
import { PredictionVolanteCard } from "@/components/domain/prediction-volante-card";
import {
  getVolanteListContainerClass,
  getVolanteListItemClass,
} from "@/components/domain/volante-layout";
import { GAMES, GAME_SLUGS, type GameSlug } from "@/modules/shared/constants";
import { Badge } from "@/components/ui/badge";
import { getGameTheme } from "@/lib/game-theme";
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

export default function PalpitesPage() {
  const searchParams = useSearchParams();
  const initialGame = (searchParams.get("game") as GameSlug) || "lotofacil";

  const [game, setGame] = useState<GameSlug>(
    GAME_SLUGS.includes(initialGame) ? initialGame : "lotofacil"
  );
  const [strategy, setStrategy] = useState<GenerationStrategy>("HYBRID");
  const [mode, setMode] = useState<GenerationMode>("BALANCED");
  const [generating, setGenerating] = useState<"single" | "batch" | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<PredictionView | null>(null);
  const [batch, setBatch] = useState<PredictionView[] | null>(null);
  const [batchSize, setBatchSize] = useState(3);
  const [isSaved, setIsSaved] = useState(false);

  const rules = GAMES[game];
  const theme = getGameTheme(game);
  const hasResults = Boolean(result || batch);

  const resetResults = () => {
    setResult(null);
    setBatch(null);
    setIsSaved(false);
  };

  const generate = async (batchCount = 1) => {
    const isBatch = batchCount > 1;
    setGenerating(isBatch ? "batch" : "single");
    resetResults();
    try {
      const res = await fetch(`/api/games/${game}/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy,
          mode,
          batchSize: batchCount > 1 ? batchCount : undefined,
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
      setGenerating(null);
    }
  };

  const saveResults = async () => {
    const predictions = batch ?? (result ? [result] : []);
    if (!predictions.length || isSaved) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/games/${game}/predictions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predictions }),
      });
      if (res.ok) {
        setIsSaved(true);
      } else {
        const err = await res.json();
        alert(err.error ?? "Erro ao salvar palpites");
      }
    } finally {
      setSaving(false);
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
            <GameModalitySelect
              id="palpites-game"
              value={game}
              onChange={setGame}
            />

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

            <div>
              <Label htmlFor="batch-size">Palpites no lote</Label>
              <Select
                id="batch-size"
                value={String(batchSize)}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="mt-1.5"
              >
                {[2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} palpites
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Quantidade usada no botão Gerar Lote (2 a 5).
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => generate()}
                disabled={generating !== null}
                className={theme.outlineButton}
              >
                {generating === "single" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Gerar Palpite
              </Button>
              <Button
                variant="outline"
                onClick={() => generate(batchSize)}
                disabled={generating !== null}
                className={theme.outlineButton}
              >
                {generating === "batch" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Gerar Lote ({batchSize})
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass lg:col-span-2 overflow-hidden">
          <div
            className="h-1 w-full"
            style={{
              background: `linear-gradient(90deg, ${rules.color}, ${rules.color}99)`,
            }}
          />
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Resultado</CardTitle>
            {hasResults && (
              isSaved ? (
                <Badge variant="success">
                  {batch
                    ? `Lote salvo (${batch.length} palpites)`
                    : "Salvo no histórico"}
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveResults}
                  disabled={saving || generating !== null}
                  className={theme.outlineButton}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar
                </Button>
              )
            )}
          </CardHeader>
          <CardContent>
            {batch ? (
              <div className="space-y-3">
                <div className={getVolanteListContainerClass(game)}>
                  {batch.map((p, i) => (
                    <div key={p.hash ?? i} className={getVolanteListItemClass(game)}>
                      <PredictionVolanteCard
                        game={game}
                        numbers={p.numbers}
                        title={`Palpite ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
                {batch.some((p) => p.explanation) && (
                  <p className="text-sm text-muted-foreground pt-1 border-t border-border/40">
                    {batch.find((p) => p.explanation)?.explanation}
                  </p>
                )}
              </div>
            ) : result ? (
              <div className="space-y-6">
                <div className={getVolanteListItemClass(game)}>
                  <PredictionVolanteCard game={game} numbers={result.numbers} />
                </div>
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
