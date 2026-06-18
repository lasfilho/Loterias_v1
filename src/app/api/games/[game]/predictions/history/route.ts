import { NextResponse } from "next/server";
import { isGameSlug } from "@/modules/shared/constants";
import { getPredictions } from "@/modules/shared/services/game-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ game: string }> }
) {
  const { game } = await params;
  if (!isGameSlug(game)) {
    return NextResponse.json({ error: "Jogo inválido" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");

  try {
    const predictions = await getPredictions(
      game,
      limit ? parseInt(limit) : 20
    );
    return NextResponse.json(predictions);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
