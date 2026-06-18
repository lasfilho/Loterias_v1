import { notFound } from "next/navigation";
import { DisclaimerBanner, PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/domain/stat-card";
import { DrawNumbers } from "@/components/domain/number-ball";
import {
  DelayChart,
  FrequencyChart,
  ParityChart,
  RangeChart,
} from "@/components/charts/analytics-charts";
import { GAMES, type GameSlug, isGameSlug } from "@/modules/shared/constants";
import {
  getAnalytics,
  getRepository,
} from "@/modules/shared/services/game-service";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface GameDashboardProps {
  slug: GameSlug;
}

export async function GameDashboard({ slug }: GameDashboardProps) {
  const rules = GAMES[slug];
  const repo = getRepository(slug);

  let analytics: Awaited<ReturnType<typeof getAnalytics>> | null = null;
  let latestDraw: Awaited<ReturnType<typeof repo.findMany>>[0] | null = null;

  try {
    analytics = await getAnalytics(slug);
    const draws = await repo.findMany({ limit: 1 });
    latestDraw = draws[0] ?? null;
  } catch {
    analytics = null;
  }

  return (
    <div>
      <PageHeader
        title={rules.name}
        description={rules.description}
      >
        <Link href={`/palpites?game=${slug}`}>
          <Button size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" /> Gerar Palpite
          </Button>
        </Link>
      </PageHeader>

      <DisclaimerBanner />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <StatCard
          title="Total de Concursos"
          value={analytics?.totalDraws.toLocaleString("pt-BR") ?? "0"}
        />
        <StatCard
          title="Último Concurso"
          value={analytics?.lastContest ?? "—"}
        />
        <StatCard
          title="Último Sorteio"
          value={
            analytics?.lastDrawDate
              ? formatDate(analytics.lastDrawDate)
              : "—"
          }
        />
        <StatCard
          title="Números Quentes"
          value={analytics?.hotNumbers.slice(0, 3).map((n) => String(n).padStart(2, "0")).join(", ") ?? "—"}
          subtitle="Maior frequência histórica"
        />
      </div>

      {latestDraw && (
        <Card className="glass mt-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Último Resultado
              <Badge variant="secondary">
                Concurso {latestDraw.contestNumber}
              </Badge>
              {latestDraw.accumulated && (
                <Badge variant="warning">Acumulou</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DrawNumbers numbers={latestDraw.numbers} color={rules.color} />
            <p className="text-xs text-muted-foreground mt-3">
              {formatDate(latestDraw.drawDate)}
            </p>
          </CardContent>
        </Card>
      )}

      {analytics && analytics.totalDraws > 0 ? (
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <FrequencyChart
            data={analytics.frequency}
            color={rules.color}
          />
          <DelayChart data={analytics.delays} color={rules.color} />
          <ParityChart
            even={analytics.parity.even}
            odd={analytics.parity.odd}
            color={rules.color}
          />
          <RangeChart data={analytics.ranges} color={rules.color} />
        </div>
      ) : (
        <div className="mt-8 text-center glass rounded-xl p-12">
          <p className="text-muted-foreground mb-4">
            Sem dados para {rules.name}. Importe os concursos históricos.
          </p>
          <Link href="/importacao">
            <Button>Importar Dados</Button>
          </Link>
        </div>
      )}

      {analytics && analytics.topPairs.length > 0 && (
        <Card className="glass mt-8">
          <CardHeader>
            <CardTitle className="text-base">Pares Mais Recorrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {analytics.topPairs.slice(0, 12).map((p) => (
                <div
                  key={`${p.pair[0]}-${p.pair[1]}`}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                >
                  <span className="font-mono text-sm">
                    {String(p.pair[0]).padStart(2, "0")} +{" "}
                    {String(p.pair[1]).padStart(2, "0")}
                  </span>
                  <Badge variant="outline">{p.count}x</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function createGamePage(slug: GameSlug) {
  return function GamePage() {
    if (!isGameSlug(slug)) notFound();
    return <GameDashboard slug={slug} />;
  };
}
