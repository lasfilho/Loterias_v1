import { PredictionStrategy } from "@prisma/client";
import { NextResponse } from "next/server";
import { isGameSlug } from "@/modules/shared/constants";
import {
  generatePredictions,
  normalizePredictionPayload,
  saveGeneratedPredictions,
} from "@/modules/shared/services/game-service";
import type {
  GenerationMode,
  GenerationRequest,
  GenerationStrategy,
} from "@/modules/shared/prediction/types";

function parseRequest(body: Record<string, unknown>): GenerationRequest {
  return {
    strategy: body.strategy as GenerationStrategy | undefined,
    mode: body.mode as GenerationMode | undefined,
    count: body.count as number | undefined,
    batchSize: body.batchSize as number | undefined,
    excludeNumbers: body.excludeNumbers as number[] | undefined,
    includeNumbers: body.includeNumbers as number[] | undefined,
    filter: body.filter as GenerationRequest["filter"],
    weights: body.weights as GenerationRequest["weights"],
    seed: body.seed as number | undefined,
    minDiversity: body.minDiversity as number | undefined,
    persist: (body.save ?? body.persist) as boolean | undefined,
    notes: body.notes as string | undefined,
    analysisRunId: body.analysisRunId as string | undefined,
    configId: body.configId as string | undefined,
  };
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
    const req = parseRequest(body);

    const legacyStrategy = body.strategy as PredictionStrategy | undefined;
    if (legacyStrategy && !req.strategy) {
      req.strategy = legacyStrategy as GenerationRequest["strategy"];
    }

    const result = await generatePredictions(game, req);

    if (result.prediction) {
      const p = result.prediction;
      const response = {
        ...p,
        numbers: p.numbers,
        id: result.savedId,
      };
      return NextResponse.json(response);
    }

    if (result.batch) {
      return NextResponse.json({
        batch: result.batch,
        savedId: result.savedId,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ game: string }> }
) {
  const { game } = await params;
  if (!isGameSlug(game)) {
    return NextResponse.json({ error: "Jogo inválido" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rawList = (body.predictions ?? (body.prediction ? [body.prediction] : [])) as
      | Record<string, unknown>[]
      | undefined;

    if (!rawList?.length) {
      return NextResponse.json(
        { error: "Nenhum palpite para salvar" },
        { status: 400 }
      );
    }

    const predictions = rawList.map((raw) =>
      normalizePredictionPayload(game, raw)
    );
    const savedIds = await saveGeneratedPredictions(
      game,
      predictions,
      body.notes as string | undefined,
      {
        analysisRunId: body.analysisRunId as string | undefined,
        configId: body.configId as string | undefined,
      }
    );

    return NextResponse.json({
      savedIds,
      savedId: savedIds[0],
      count: savedIds.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ game: string }> }
) {
  const { game } = await params;
  if (!isGameSlug(game)) {
    return NextResponse.json({ error: "Jogo inválido" }, { status: 400 });
  }

  const { getPredictions } = await import(
    "@/modules/shared/services/game-service"
  );
  const predictions = await getPredictions(game, 50);

  return NextResponse.json({ predictions });
}
