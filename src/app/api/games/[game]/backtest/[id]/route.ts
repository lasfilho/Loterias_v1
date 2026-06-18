import { NextResponse } from "next/server";
import { getBacktestById } from "@/modules/shared/services/game-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ game: string; id: string }> }
) {
  const { id } = await params;

  try {
    const run = await getBacktestById(id);
    if (!run) {
      return NextResponse.json({ error: "Backtest não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ run });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
