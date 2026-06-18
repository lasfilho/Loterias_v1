import { NextResponse } from "next/server";
import { isGameSlug } from "@/modules/shared/constants";
import { comparePredictionStrategies } from "@/modules/shared/services/game-service";
import type {
  GenerationMode,
  GenerationRequest,
} from "@/modules/shared/prediction/types";

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
    const req: GenerationRequest = {
      mode: body.mode as GenerationMode | undefined,
      count: body.count as number | undefined,
      excludeNumbers: body.excludeNumbers as number[] | undefined,
      includeNumbers: body.includeNumbers as number[] | undefined,
      filter: body.filter as GenerationRequest["filter"],
      weights: body.weights as GenerationRequest["weights"],
      seed: body.seed as number | undefined,
    };

    const comparison = await comparePredictionStrategies(game, req);

    return NextResponse.json({
      game,
      mode: req.mode ?? "BALANCED",
      comparison,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
