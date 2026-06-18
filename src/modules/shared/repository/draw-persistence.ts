import { Prisma } from "@prisma/client";
import { type NormalizedDraw } from "../types";
import { type LoadDrawInput } from "../etl/types";

export function toDrawData(draw: NormalizedDraw) {
  return {
    contestNumber: draw.contestNumber,
    drawDate: draw.drawDate,
    numbers: draw.numbers,
    accumulated: draw.accumulated,
    prizePool: draw.prizePool,
    winnersCount: draw.winnersCount,
    nextEstimate: draw.nextEstimate,
  };
}

export function toDrawDataWithContext(input: LoadDrawInput) {
  return {
    ...toDrawData(input.draw),
    importBatchId: input.importBatchId,
    dataSourceId: input.dataSourceId,
    rawPayload: input.rawPayload as Prisma.InputJsonValue | undefined,
  };
}
