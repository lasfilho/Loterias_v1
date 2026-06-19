import { prisma } from "@/lib/db";
import type { GameSlug } from "../constants";
import { getBetWeekStart } from "./week-utils";

export async function assignBetWeekFields(
  slug: GameSlug,
  savedAt: Date = new Date()
): Promise<{ betWeekStart: Date; betSlot: number }> {
  const betWeekStart = getBetWeekStart(savedAt);
  const countWhere = { betWeekStart };

  let existing = 0;
  switch (slug) {
    case "lotofacil":
      existing = await prisma.lotofacilPrediction.count({ where: countWhere });
      break;
    case "megasena":
      existing = await prisma.megasenaPrediction.count({ where: countWhere });
      break;
    case "quina":
      existing = await prisma.quinaPrediction.count({ where: countWhere });
      break;
  }

  return { betWeekStart, betSlot: existing + 1 };
}
