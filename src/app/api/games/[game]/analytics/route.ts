import { NextResponse } from "next/server";
import { isGameSlug } from "@/modules/shared/constants";
import { getAnalytics } from "@/modules/shared/services/game-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ game: string }> }
) {
  const { game } = await params;
  if (!isGameSlug(game)) {
    return NextResponse.json({ error: "Jogo inválido" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const fromContest = searchParams.get("fromContest");
  const toContest = searchParams.get("toContest");
  const limit = searchParams.get("limit");

  try {
    const analytics = await getAnalytics(game, {
      fromContest: fromContest ? parseInt(fromContest) : undefined,
      toContest: toContest ? parseInt(toContest) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return NextResponse.json(analytics);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
