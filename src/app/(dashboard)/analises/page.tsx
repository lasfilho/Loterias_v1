"use client";

import { useEffect, useState } from "react";
import { DisclaimerBanner, PageHeader } from "@/components/layout/page-header";
import { Label, Select, Input } from "@/components/ui/input";
import {
  DelayChart,
  FrequencyChart,
  ParityChart,
  RangeChart,
} from "@/components/charts/analytics-charts";
import {
  GAMES,
  GAME_SLUGS,
  type GameSlug,
} from "@/modules/shared/constants";
import { Button } from "@/components/ui/button";
import type { AnalyticsSummary } from "@/modules/shared/types";

export default function AnalisesPage() {
  const [game, setGame] = useState<GameSlug>("lotofacil");
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [fromContest, setFromContest] = useState("");
  const [toContest, setToContest] = useState("");
  const [loading, setLoading] = useState(false);

  const rules = GAMES[game];

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromContest) params.set("fromContest", fromContest);
      if (toContest) params.set("toContest", toContest);
      const res = await fetch(
        `/api/games/${game}/analytics?${params.toString()}`
      );
      if (res.ok) setAnalytics(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  return (
    <div>
      <PageHeader
        title="Análises Avançadas"
        description="Frequências, atrasos, padrões e tendências com filtros configuráveis"
      />

      <DisclaimerBanner />

      <div className="glass rounded-xl p-6 mt-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Label>Concurso inicial</Label>
            <Input
              type="number"
              placeholder="Ex: 1"
              value={fromContest}
              onChange={(e) => setFromContest(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Concurso final</Label>
            <Input
              type="number"
              placeholder="Ex: 3000"
              value={toContest}
              onChange={(e) => setToContest(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchAnalytics} disabled={loading} className="w-full">
              {loading ? "Carregando..." : "Aplicar Filtros"}
            </Button>
          </div>
        </div>
      </div>

      {analytics && analytics.totalDraws > 0 ? (
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <FrequencyChart data={analytics.frequency} color={rules.color} />
          <DelayChart data={analytics.delays} color={rules.color} />
          <ParityChart
            even={analytics.parity.even}
            odd={analytics.parity.odd}
            color={rules.color}
          />
          <RangeChart data={analytics.ranges} color={rules.color} />
        </div>
      ) : (
        <div className="mt-8 text-center glass rounded-xl p-12 text-muted-foreground text-sm">
          Sem dados para análise. Importe concursos primeiro.
        </div>
      )}
    </div>
  );
}
