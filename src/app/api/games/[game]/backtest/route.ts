import { NextResponse } from "next/server";
import { isGameSlug } from "@/modules/shared/constants";
import {
  getBacktestHistory,
  runBacktest,
} from "@/modules/shared/services/game-service";
import type { BacktestRequest } from "@/modules/shared/backtest/types";
import type { GenerationMode } from "@/modules/shared/prediction/types";
import type { GenerationStrategy } from "@/modules/shared/prediction/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ game: string }> }
) {
  const { game } = await params;
  if (!isGameSlug(game)) {
    return NextResponse.json({ error: "Jogo inválido" }, { status: 400 });
  }

  try {
    const runs = await getBacktestHistory(game, 30);
    return NextResponse.json({ runs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ game: string }> }
) {
  const { game } = await params;
  if (!isGameSlug(game)) {
    return NextResponse.json({ error: "Jogo inválido" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const req: BacktestRequest = {
      fromContest: body.fromContest as number | undefined,
      toContest: body.toContest as number | undefined,
      windowSize: body.windowSize as number | undefined,
      trainMinDraws: body.trainMinDraws as number | undefined,
      mode: body.mode as GenerationMode | undefined,
      strategies: body.strategies as GenerationStrategy[] | undefined,
      includeRandomBaseline: body.includeRandomBaseline as boolean | undefined,
      persist: (body.persist ?? body.save) as boolean | undefined,
      persistDetails: body.persistDetails as boolean | undefined,
      triggeredBy: "api",
    };

    const { report, runId } = await runBacktest(game, req);
    return NextResponse.json({ report, runId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
