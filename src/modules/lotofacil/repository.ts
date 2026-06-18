import { prisma } from "@/lib/db";
import { type LoadDrawInput } from "../shared/etl/types";
import { type DrawFilter, type NormalizedDraw } from "../shared/types";
import {
  toDrawData,
  toDrawDataWithContext,
} from "../shared/repository/draw-persistence";
import {
  type DrawRecord,
  type GameRepository,
} from "../shared/repository/base-repository";

export class LotofacilRepository implements GameRepository {
  async count(): Promise<number> {
    return prisma.lotofacilDraw.count();
  }

  async getLatestContest(): Promise<number | null> {
    const latest = await prisma.lotofacilDraw.findFirst({
      orderBy: { contestNumber: "desc" },
      select: { contestNumber: true },
    });
    return latest?.contestNumber ?? null;
  }

  async contestExists(contestNumber: number): Promise<boolean> {
    const row = await prisma.lotofacilDraw.findUnique({
      where: { contestNumber },
      select: { contestNumber: true },
    });
    return row !== null;
  }

  async findMany(filter?: DrawFilter): Promise<DrawRecord[]> {
    const where: Record<string, unknown> = {};
    if (filter?.fromContest || filter?.toContest) {
      where.contestNumber = {
        ...(filter.fromContest && { gte: filter.fromContest }),
        ...(filter.toContest && { lte: filter.toContest }),
      };
    }
    if (filter?.fromDate || filter?.toDate) {
      where.drawDate = {
        ...(filter.fromDate && { gte: filter.fromDate }),
        ...(filter.toDate && { lte: filter.toDate }),
      };
    }

    const draws = await prisma.lotofacilDraw.findMany({
      where,
      orderBy: { contestNumber: "desc" },
      take: filter?.limit,
    });

    return draws.map((d) => ({
      contestNumber: d.contestNumber,
      drawDate: d.drawDate,
      numbers: d.numbers,
      accumulated: d.accumulated,
      prizePool: d.prizePool,
      winnersCount: d.winnersCount,
      nextEstimate: d.nextEstimate,
    }));
  }

  async upsert(draw: NormalizedDraw): Promise<void> {
    const data = toDrawData(draw);
    await prisma.lotofacilDraw.upsert({
      where: { contestNumber: draw.contestNumber },
      create: data,
      update: data,
    });
  }

  async upsertWithContext(input: LoadDrawInput): Promise<"created" | "updated"> {
    const exists = await this.contestExists(input.draw.contestNumber);
    const data = toDrawDataWithContext(input);
    await prisma.lotofacilDraw.upsert({
      where: { contestNumber: input.draw.contestNumber },
      create: data,
      update: data,
    });
    return exists ? "updated" : "created";
  }

  async upsertMany(draws: NormalizedDraw[]): Promise<number> {
    let count = 0;
    for (const draw of draws) {
      await this.upsert(draw);
      count++;
    }
    return count;
  }
}
