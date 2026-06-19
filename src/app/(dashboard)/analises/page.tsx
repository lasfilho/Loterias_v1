"use client";

import { useState } from "react";
import { DisclaimerBanner, PageHeader } from "@/components/layout/page-header";
import { GameModalitySelect } from "@/components/domain/game-modality-select";
import { GameAnalyticsView } from "@/components/dashboard/game-analytics-view";
import { type GameSlug } from "@/modules/shared/constants";

export default function AnalisesPage() {
  const [game, setGame] = useState<GameSlug>("lotofacil");

  return (
    <div>
      <PageHeader
        title="Análises"
        description="Visão geral, distribuição e padrões estatísticos — mesmo conteúdo das modalidades, centralizado por jogo"
      />

      <DisclaimerBanner />

      <div className="glass rounded-xl p-6 mt-8 max-w-md">
        <GameModalitySelect
          id="analises-game"
          value={game}
          onChange={setGame}
        />
      </div>

      <GameAnalyticsView slug={game} className="mt-8" />
    </div>
  );
}
