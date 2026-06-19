import { NextResponse } from "next/server";
import { isGameSlug } from "@/modules/shared/constants";
import { deletePrediction } from "@/modules/shared/services/game-service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ game: string; id: string }> }
) {
  const { game, id } = await params;

  if (!isGameSlug(game)) {
    return NextResponse.json({ error: "Jogo inválido" }, { status: 400 });
  }

  try {
    await deletePrediction(game, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    if (message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Palpite não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
