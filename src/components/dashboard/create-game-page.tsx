import { GameDashboardView } from "@/components/dashboard/game-dashboard-view";
import type { GameSlug } from "@/modules/shared/constants";
import { isGameSlug } from "@/modules/shared/constants";
import { notFound } from "next/navigation";

export function createGameDashboardPage(slug: GameSlug) {
  return function GameDashboardPage() {
    if (!isGameSlug(slug)) notFound();
    return <GameDashboardView slug={slug} />;
  };
}
