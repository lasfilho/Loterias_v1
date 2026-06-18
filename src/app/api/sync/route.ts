import { NextResponse } from "next/server";
import { isGameSlug } from "@/modules/shared/constants";
import { syncGame, getSyncLogs } from "@/modules/shared/services/game-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const game = body.game as string;
    const maxContests = body.maxContests as number | undefined;

    if (!isGameSlug(game)) {
      return NextResponse.json({ error: "Jogo inválido" }, { status: 400 });
    }

    const result = await syncGame(game, maxContests);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro na sincronização" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const logs = await getSyncLogs(20);
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
