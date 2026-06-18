"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Database,
  Layers,
  TrendingUp,
} from "lucide-react";
import { GAMES, GAME_SLUGS, type GameSlug } from "@/modules/shared/constants";
import { fetchDashboardStats } from "@/lib/api-client";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SectionShell } from "@/components/dashboard/section-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ErrorState } from "@/components/dashboard/error-state";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import { InfoBlock } from "@/components/dashboard/info-block";
import { MethodologyAccordion } from "@/components/dashboard/methodology-accordion";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface GameStat {
  slug: GameSlug;
  name: string;
  shortName?: string;
  color: string;
  totalDraws: number;
  latestContest: number | null;
  lastDrawDate: string | null;
}

export function OverviewDashboardView() {
  const [stats, setStats] = useState<GameStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const totalDraws = stats.reduce((s, g) => s + g.totalDraws, 0);
  const latestDate = stats
    .map((g) => g.lastDrawDate)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Dashboard Principal"
        description="Visão consolidada das três modalidades com domínios analíticos independentes"
        badge={totalDraws > 0 ? "Operacional" : "Aguardando dados"}
        engineVersion="2.0.0"
      />

      <InfoBlock variant="accent">
        Plataforma de análise estatística para Lotofácil, Mega-Sena e Quina.
        Cada modalidade possui dashboard dedicado com filtros, indicadores e
        backtests próprios.
      </InfoBlock>

      <SectionShell title="Indicadores consolidados">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Total de concursos"
            value={totalDraws.toLocaleString("pt-BR")}
            subtitle="Soma das 3 modalidades"
            icon={<Layers className="h-4 w-4" />}
          />
          <KpiCard
            title="Modalidades ativas"
            value={stats.filter((g) => g.totalDraws > 0).length}
            subtitle="De 3 jogos monitorados"
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <KpiCard
            title="Última atualização"
            value={latestDate ? formatDate(latestDate) : "—"}
            subtitle="Sorteio mais recente na base"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KpiCard
            title="Status da plataforma"
            value={totalDraws > 0 ? "Ativo" : "Setup"}
            subtitle={
              totalDraws > 0 ? "Base populada" : "Importe os concursos"
            }
            icon={<Database className="h-4 w-4" />}
          />
        </div>
      </SectionShell>

      <SectionShell
        title="Modalidades"
        description="Acesse o dashboard analítico dedicado de cada jogo"
      >
        {totalDraws === 0 ? (
          <EmptyState
            title="Nenhum concurso importado"
            description="Sincronize os dados históricos para habilitar KPIs, gráficos e backtests."
            actionLabel="Importar concursos"
            actionHref="/importacao"
            icon="database"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {GAME_SLUGS.map((slug) => {
              const game = stats.find((g) => g.slug === slug) ?? {
                slug,
                name: GAMES[slug].name,
                color: GAMES[slug].color,
                totalDraws: 0,
                latestContest: null,
                lastDrawDate: null,
              };
              return (
                <Link
                  key={slug}
                  href={`/${slug}`}
                  className="group glass rounded-xl p-6 transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                        style={{ background: game.color }}
                      >
                        {GAMES[slug].shortName[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {game.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {game.totalDraws.toLocaleString("pt-BR")} concursos
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="mt-5 pt-4 border-t border-border/60 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        Último
                      </p>
                      <p className="font-medium tabular-nums mt-0.5">
                        #{game.latestContest ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        Data
                      </p>
                      <p className="font-medium mt-0.5">
                        {game.lastDrawDate
                          ? formatDate(game.lastDrawDate)
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    {GAMES[slug].pickCount} dezenas · universo 1–
                    {GAMES[slug].maxNumber}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </SectionShell>

      {totalDraws > 0 && (
        <SectionShell title="Ações rápidas">
          <div className="flex flex-wrap gap-3">
            <Link href="/importacao">
              <Button variant="outline" className="gap-2">
                <Database className="h-4 w-4" />
                Sincronizar dados
              </Button>
            </Link>
            <Link href="/palpites">
              <Button className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Gerar palpites
              </Button>
            </Link>
          </div>
        </SectionShell>
      )}

      <MethodologyAccordion />
    </div>
  );
}
