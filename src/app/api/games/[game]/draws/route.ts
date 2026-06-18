import { NextResponse } from "next/server";
import { isGameSlug } from "@/modules/shared/constants";
import { getRepository } from "@/modules/shared/services/game-service";

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
  const fromContest = searchParams.get("fromContest");
  const toContest = searchParams.get("toContest");

  try {
    const repo = getRepository(game);
    const draws = await repo.findMany({
      limit: limit ? parseInt(limit) : 50,
      fromContest: fromContest ? parseInt(fromContest) : undefined,
      toContest: toContest ? parseInt(toContest) : undefined,
    });
    return NextResponse.json(draws);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
