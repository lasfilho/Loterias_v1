import { NextResponse } from "next/server";
import { isGameSlug } from "@/modules/shared/constants";
import {
  assignPredictionToSlot,
  getWeeklyConference,
  markWeekAsReviewed,
  setWeekBetCount,
  syncAndCheckWeeklyConference,
} from "@/modules/shared/weekly-bet/conference.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game") ?? "lotofacil";
  const weekStart = searchParams.get("weekStart") ?? undefined;

  if (!isGameSlug(game)) {
    return NextResponse.json({ error: "Jogo inválido" }, { status: 400 });
  }

  try {
    const conference = await getWeeklyConference(game, weekStart, {
      persist: true,
    });
    return NextResponse.json(conference);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action as string | undefined;
    const game = body.game as string;
    const weekStart = body.weekStart as string | undefined;

    if (!isGameSlug(game)) {
      return NextResponse.json({ error: "Jogo inválido" }, { status: 400 });
    }

    if (action === "review") {
      if (!weekStart) {
        return NextResponse.json(
          { error: "weekStart é obrigatório" },
          { status: 400 }
        );
      }
      await markWeekAsReviewed(game, weekStart);
      const conference = await getWeeklyConference(game, weekStart, {
        persist: true,
      });
      return NextResponse.json(conference);
    }

    if (action === "assign") {
      const weekday = body.weekday as number | undefined;
      const betSlot = body.betSlot as number | undefined;
      const predictionId = body.predictionId as string | undefined;

      if (!weekStart || weekday === undefined || !betSlot || !predictionId) {
        return NextResponse.json(
          { error: "weekStart, weekday, betSlot e predictionId são obrigatórios" },
          { status: 400 }
        );
      }

      const conference = await assignPredictionToSlot(
        game,
        weekStart,
        weekday,
        betSlot,
        predictionId
      );
      return NextResponse.json(conference);
    }

    if (action === "setBetCount") {
      const betCount = body.betCount as number | undefined;
      if (!weekStart || !betCount) {
        return NextResponse.json(
          { error: "weekStart e betCount são obrigatórios" },
          { status: 400 }
        );
      }
      const conference = await setWeekBetCount(game, weekStart, betCount);
      return NextResponse.json(conference);
    }

    const result = await syncAndCheckWeeklyConference(game, weekStart);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao conferir" },
      { status: 500 }
    );
  }
}
