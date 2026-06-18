import { DisclaimerBanner, PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PREDICTION_STRATEGIES, GAMES, GAME_SLUGS } from "@/modules/shared/constants";

export default function ConfiguracoesPage() {
  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Regras por modalidade e estratégias de geração de palpites"
      />

      <DisclaimerBanner />

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">Regras por Modalidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {GAME_SLUGS.map((slug) => {
              const game = GAMES[slug];
              return (
                <div
                  key={slug}
                  className="rounded-lg border border-border p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded-md"
                      style={{ background: game.color }}
                    />
                    <span className="font-medium text-sm">{game.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Universo: {game.minNumber}–{game.maxNumber}</span>
                    <span>Sorteados: {game.drawCount}</span>
                    <span>Aposta: {game.pickCount} números</span>
                    <span>API: {game.apiSlug}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">Estratégias de Palpite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PREDICTION_STRATEGIES.map((s) => (
              <div
                key={s.value}
                className="rounded-lg bg-muted/30 px-4 py-3"
              >
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {s.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="glass mt-6">
        <CardHeader>
          <CardTitle className="text-base">Autenticação</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Login opcional planejado para fase 2 (NextAuth). Atualmente o sistema
            opera em modo aberto para desenvolvimento local.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
