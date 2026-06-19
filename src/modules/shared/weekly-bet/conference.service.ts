import { BetCheckStatus, GameType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { countHits } from "../backtest/metrics";
import { type GameSlug, isGameSlug } from "../constants";
import { getRepository } from "../repository/registry";
import { syncGame } from "../services/game-service";
import { DRAW_WEEKDAYS, DEFAULT_BET_COUNT, MAX_BET_COUNT, WEEKDAY_LABELS } from "./constants";
import { getPrizeBand, isPrizeEligible } from "./prize-band";
import type {
  ConferenceCheckView,
  ConferenceDayView,
  ConferenceDrawStatus,
  ConferenceSummaryView,
  ConferenceSyncResult,
  ConferenceWeekView,
  SavedBetView,
} from "./types";
import {
  formatWeekLabel,
  getBetWeekEnd,
  getBetWeekStart,
  getDayBounds,
  getExpectedDateForWeekday,
  parseDateKey,
  startOfCalendarDay,
  toDateKey,
} from "./week-utils";

type PredictionRow = {
  id: string;
  numbers: number[];
  strategy: string;
  betSlot: number;
  betWeekStart: Date | null;
  notes: string | null;
  createdAt: Date;
  metadata: unknown;
};

const GAME_TYPE_MAP: Record<GameSlug, GameType> = {
  lotofacil: GameType.LOTOFACIL,
  megasena: GameType.MEGASENA,
  quina: GameType.QUINA,
};

function resolveBetWeekStart(row: PredictionRow): Date {
  if (row.betWeekStart) return row.betWeekStart;
  return getBetWeekStart(row.createdAt);
}

function extractStrategyDetail(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const m = metadata as Record<string, unknown>;
  return typeof m.strategyDetail === "string" ? m.strategyDetail : undefined;
}

function extractHash(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const m = metadata as Record<string, unknown>;
  return typeof m.hash === "string" ? m.hash : undefined;
}

async function fetchPredictionsForWeek(
  slug: GameSlug,
  weekStart: Date
): Promise<PredictionRow[]> {
  const weekKey = toDateKey(weekStart);

  const select = {
    id: true,
    numbers: true,
    strategy: true,
    betSlot: true,
    betWeekStart: true,
    notes: true,
    createdAt: true,
    metadata: true,
  } satisfies Prisma.LotofacilPredictionSelect;

  let rows: PredictionRow[];

  switch (slug) {
    case "lotofacil":
      rows = await prisma.lotofacilPrediction.findMany({
        where: {
          OR: [
            { betWeekStart: weekStart },
            {
              betWeekStart: null,
              createdAt: { gte: weekStart, lte: getBetWeekEnd(weekStart) },
            },
          ],
        },
        orderBy: [{ betSlot: "asc" }, { createdAt: "asc" }],
        select,
      });
      break;
    case "megasena":
      rows = await prisma.megasenaPrediction.findMany({
        where: {
          OR: [
            { betWeekStart: weekStart },
            {
              betWeekStart: null,
              createdAt: { gte: weekStart, lte: getBetWeekEnd(weekStart) },
            },
          ],
        },
        orderBy: [{ betSlot: "asc" }, { createdAt: "asc" }],
        select,
      });
      break;
    case "quina":
      rows = await prisma.quinaPrediction.findMany({
        where: {
          OR: [
            { betWeekStart: weekStart },
            {
              betWeekStart: null,
              createdAt: { gte: weekStart, lte: getBetWeekEnd(weekStart) },
            },
          ],
        },
        orderBy: [{ betSlot: "asc" }, { createdAt: "asc" }],
        select,
      });
      break;
  }

  return rows.filter((r) => toDateKey(resolveBetWeekStart(r)) === weekKey);
}

async function findDrawByCalendarDay(slug: GameSlug, day: Date) {
  const { start, end } = getDayBounds(day);
  const repo = getRepository(slug);
  const draws = await repo.findMany({ fromDate: start, toDate: end, limit: 5 });
  if (draws.length === 0) return null;
  return draws.sort((a, b) => a.contestNumber - b.contestNumber)[0];
}

function resolveLiveStatus(
  expectedDate: Date,
  now: Date
): ConferenceDrawStatus {
  const today = toDateKey(now);
  const expected = toDateKey(expectedDate);
  if (expected > today) return "future";
  if (expected === today) return "awaiting";
  return "not_found";
}

function toBetCheckStatus(status: ConferenceDrawStatus): BetCheckStatus {
  switch (status) {
    case "checked":
      return BetCheckStatus.CHECKED;
    case "not_found":
      return BetCheckStatus.DRAW_NOT_FOUND;
    case "future":
      return BetCheckStatus.FUTURE;
    default:
      return BetCheckStatus.AWAITING_DRAW;
  }
}

async function upsertSlotCheck(
  gameType: GameType,
  weekStart: Date,
  weekday: number,
  betSlot: number,
  expectedDate: Date,
  predictionId: string | null,
  data: {
    status: BetCheckStatus;
    contestNumber?: number | null;
    drawNumbers?: number[];
    matchedNumbers?: number[];
    hits?: number | null;
    prizeBand?: string | null;
  }
) {
  await prisma.weeklyBetCheck.upsert({
    where: {
      gameType_weekStart_weekday_betSlot: {
        gameType,
        weekStart,
        weekday,
        betSlot,
      },
    },
    create: {
      gameType,
      weekStart,
      weekday,
      betSlot,
      expectedDate,
      predictionId,
      status: data.status,
      contestNumber: data.contestNumber ?? null,
      drawNumbers: data.drawNumbers ?? [],
      matchedNumbers: data.matchedNumbers ?? [],
      hits: data.hits ?? null,
      prizeBand: data.prizeBand ?? null,
      checkedAt: data.status === BetCheckStatus.CHECKED ? new Date() : null,
    },
    update: {
      predictionId,
      expectedDate,
      status: data.status,
      contestNumber: data.contestNumber ?? null,
      drawNumbers: data.drawNumbers ?? [],
      matchedNumbers: data.matchedNumbers ?? [],
      hits: data.hits ?? null,
      prizeBand: data.prizeBand ?? null,
      checkedAt: data.status === BetCheckStatus.CHECKED ? new Date() : null,
    },
  });
}

function createEmptySlotView(
  weekday: number,
  betSlot: number,
  expectedDate: Date
): ConferenceCheckView {
  return {
    predictionId: null,
    betSlot,
    betNumbers: [],
    strategy: "",
    weekday,
    weekdayLabel: WEEKDAY_LABELS[weekday] ?? String(weekday),
    expectedDate: toDateKey(expectedDate),
    status: "unassigned",
    assigned: false,
    drawNumbers: [],
    matchedNumbers: [],
    hits: null,
    prizeBand: null,
    isPrizeEligible: false,
  };
}

async function buildCheckForAssignedSlot(
  slug: GameSlug,
  bet: PredictionRow,
  weekStart: Date,
  weekday: number,
  betSlot: number,
  now: Date,
  persist: boolean
): Promise<ConferenceCheckView> {
  const gameType = GAME_TYPE_MAP[slug];
  const expectedDate = getExpectedDateForWeekday(weekStart, weekday);
  const draw = await findDrawByCalendarDay(slug, expectedDate);

  let status: ConferenceDrawStatus;
  let hits: number | null = null;
  let matchedNumbers: number[] = [];
  let prizeBand: string | null = null;
  let drawNumbers: number[] = [];
  let contestNumber: number | undefined;
  let drawDate: string | undefined;

  if (draw) {
    hits = countHits(bet.numbers, draw.numbers);
    const drawSet = new Set(draw.numbers);
    matchedNumbers = bet.numbers.filter((n) => drawSet.has(n));
    prizeBand = getPrizeBand(slug, hits);
    drawNumbers = draw.numbers;
    contestNumber = draw.contestNumber;
    drawDate = draw.drawDate.toISOString();
    status = "checked";
  } else {
    status = resolveLiveStatus(expectedDate, now);
  }

  const dbStatus = toBetCheckStatus(status);

  if (persist) {
    await upsertSlotCheck(
      gameType,
      weekStart,
      weekday,
      betSlot,
      expectedDate,
      bet.id,
      {
        status: dbStatus,
        contestNumber: contestNumber ?? null,
        drawNumbers,
        matchedNumbers,
        hits,
        prizeBand,
      }
    );
  }

  return {
    predictionId: bet.id,
    betSlot,
    betNumbers: bet.numbers,
    strategy: bet.strategy,
    strategyDetail: extractStrategyDetail(bet.metadata),
    weekday,
    weekdayLabel: WEEKDAY_LABELS[weekday] ?? String(weekday),
    expectedDate: toDateKey(expectedDate),
    status,
    assigned: true,
    contestNumber,
    drawDate,
    drawNumbers,
    matchedNumbers,
    hits,
    prizeBand,
    isPrizeEligible: hits !== null ? isPrizeEligible(slug, hits) : false,
  };
}

async function getWeekBetCount(slug: GameSlug, weekStart: Date): Promise<number> {
  const config = await prisma.weeklyConferenceConfig.findUnique({
    where: {
      gameType_weekStart: {
        gameType: GAME_TYPE_MAP[slug],
        weekStart,
      },
    },
  });
  return config?.betCount ?? DEFAULT_BET_COUNT[slug];
}

export async function setWeekBetCount(
  slug: GameSlug,
  weekStartInput: string,
  betCount: number
): Promise<ConferenceWeekView> {
  if (!isGameSlug(slug)) throw new Error(`Jogo inválido: ${slug}`);
  if (betCount < 1 || betCount > MAX_BET_COUNT) {
    throw new Error(`Quantidade de jogos deve ser entre 1 e ${MAX_BET_COUNT}`);
  }

  const weekStart = parseDateKey(weekStartInput);
  const gameType = GAME_TYPE_MAP[slug];

  await prisma.weeklyConferenceConfig.upsert({
    where: { gameType_weekStart: { gameType, weekStart } },
    create: { gameType, weekStart, betCount },
    update: { betCount },
  });

  if (betCount < MAX_BET_COUNT) {
    await prisma.weeklyBetCheck.deleteMany({
      where: { gameType, weekStart, betSlot: { gt: betCount } },
    });
  }

  return getWeeklyConference(slug, weekStart);
}

async function buildWeekSlots(
  slug: GameSlug,
  weekStart: Date,
  rows: PredictionRow[],
  now: Date,
  persist: boolean,
  betCount: number
): Promise<ConferenceCheckView[]> {
  const gameType = GAME_TYPE_MAP[slug];
  const stored = await prisma.weeklyBetCheck.findMany({
    where: { gameType, weekStart },
  });

  const checks: ConferenceCheckView[] = [];

  for (const weekday of DRAW_WEEKDAYS[slug]) {
    const expectedDate = getExpectedDateForWeekday(weekStart, weekday);

    for (let betSlot = 1; betSlot <= betCount; betSlot++) {
      const record = stored.find(
        (s) => s.weekday === weekday && s.betSlot === betSlot
      );

      if (record?.predictionId) {
        const bet = rows.find((r) => r.id === record.predictionId);
        if (bet) {
          checks.push(
            await buildCheckForAssignedSlot(
              slug,
              bet,
              weekStart,
              weekday,
              betSlot,
              now,
              persist
            )
          );
          continue;
        }
        if (persist) {
          await prisma.weeklyBetCheck.deleteMany({
            where: {
              gameType,
              weekStart,
              weekday,
              betSlot,
            },
          });
        }
      }

      checks.push(createEmptySlotView(weekday, betSlot, expectedDate));
    }
  }

  return checks;
}

function buildSummary(
  bets: SavedBetView[],
  checks: ConferenceCheckView[]
): ConferenceSummaryView {
  const assigned = checks.filter((c) => c.assigned);
  const checked = checks.filter((c) => c.status === "checked");
  const maxHits = checked.reduce((m, c) => Math.max(m, c.hits ?? 0), 0);
  const totalHits = checked.reduce((s, c) => s + (c.hits ?? 0), 0);
  const prizeEligibleCount = checked.filter((c) => c.isPrizeEligible).length;

  let bestBetLabel: string | null = null;
  if (checked.length > 0) {
    const best = checked.reduce((a, b) =>
      (a.hits ?? 0) >= (b.hits ?? 0) ? a : b
    );
    bestBetLabel = `Jogo ${best.betSlot} · ${WEEKDAY_LABELS[best.weekday]} · ${best.hits} acertos`;
  }

  return {
    totalBets: bets.length,
    totalSlots: checks.length,
    assignedSlots: assigned.length,
    checkedSlots: checked.length,
    awaitingSlots: checks.filter((c) => c.status === "awaiting").length,
    futureSlots: checks.filter((c) => c.status === "future").length,
    notFoundSlots: checks.filter((c) => c.status === "not_found").length,
    maxHits,
    totalHits,
    prizeEligibleCount,
    bestBetLabel,
  };
}

function groupChecksByDay(
  slug: GameSlug,
  weekStart: Date,
  checks: ConferenceCheckView[]
): ConferenceDayView[] {
  return DRAW_WEEKDAYS[slug].map((weekday) => {
    const dayChecks = checks.filter((c) => c.weekday === weekday);
    const expectedDate = toDateKey(getExpectedDateForWeekday(weekStart, weekday));
    return {
      weekday,
      weekdayLabel: WEEKDAY_LABELS[weekday] ?? String(weekday),
      expectedDate: dayChecks[0]?.expectedDate ?? expectedDate,
      checks: dayChecks,
    };
  });
}

export async function getWeeklyConference(
  slug: GameSlug,
  weekStartInput?: string | Date,
  options?: { persist?: boolean }
): Promise<ConferenceWeekView> {
  if (!isGameSlug(slug)) throw new Error(`Jogo inválido: ${slug}`);

  const weekStart =
    typeof weekStartInput === "string"
      ? parseDateKey(weekStartInput)
      : weekStartInput
        ? startOfCalendarDay(weekStartInput)
        : getBetWeekStart();

  const now = new Date();
  const rows = await fetchPredictionsForWeek(slug, weekStart);
  const betCount = await getWeekBetCount(slug, weekStart);

  const bets: SavedBetView[] = rows.map((r) => ({
    id: r.id,
    betSlot: r.betSlot,
    numbers: r.numbers,
    strategy: r.strategy,
    strategyDetail: extractStrategyDetail(r.metadata),
    notes: r.notes,
    savedAt: r.createdAt.toISOString(),
    hash: extractHash(r.metadata),
  }));

  const checks = await buildWeekSlots(
    slug,
    weekStart,
    rows,
    now,
    options?.persist ?? false,
    betCount
  );

  const review = await prisma.weeklyConferenceReview.findUnique({
    where: {
      gameType_weekStart: {
        gameType: GAME_TYPE_MAP[slug],
        weekStart,
      },
    },
  });

  const weekEnd = getBetWeekEnd(weekStart);

  return {
    game: slug,
    weekStart: toDateKey(weekStart),
    weekEnd: toDateKey(weekEnd),
    weekLabel: formatWeekLabel(weekStart),
    reviewed: Boolean(review),
    betCount,
    bets,
    days: groupChecksByDay(slug, weekStart, checks),
    summary: buildSummary(bets, checks),
  };
}

export async function assignPredictionToSlot(
  slug: GameSlug,
  weekStartInput: string,
  weekday: number,
  betSlot: number,
  predictionId: string
): Promise<ConferenceWeekView> {
  if (!isGameSlug(slug)) throw new Error(`Jogo inválido: ${slug}`);

  const weekStart = parseDateKey(weekStartInput);
  const rows = await fetchPredictionsForWeek(slug, weekStart);
  const bet = rows.find((r) => r.id === predictionId);
  const betCount = await getWeekBetCount(slug, weekStart);

  if (!bet) {
    throw new Error("Jogo não encontrado nesta semana");
  }

  if (betSlot < 1 || betSlot > betCount) {
    throw new Error("Slot de aposta inválido");
  }

  if (!DRAW_WEEKDAYS[slug].includes(weekday)) {
    throw new Error("Dia de sorteio inválido para esta modalidade");
  }

  await buildCheckForAssignedSlot(
    slug,
    bet,
    weekStart,
    weekday,
    betSlot,
    new Date(),
    true
  );

  return getWeeklyConference(slug, weekStart);
}

export async function syncAndCheckWeeklyConference(
  slug: GameSlug,
  weekStartInput?: string
): Promise<ConferenceSyncResult> {
  if (!isGameSlug(slug)) throw new Error(`Jogo inválido: ${slug}`);

  const weekStart = weekStartInput
    ? parseDateKey(weekStartInput)
    : getBetWeekStart();

  await syncGame(slug, 30);

  const conference = await getWeeklyConference(slug, weekStart, {
    persist: true,
  });

  return {
    game: slug,
    weekStart: conference.weekStart,
    syncedContests: conference.summary.checkedSlots,
    conference,
  };
}

export async function markWeekAsReviewed(
  slug: GameSlug,
  weekStartInput: string
) {
  const weekStart = parseDateKey(weekStartInput);
  await prisma.weeklyConferenceReview.upsert({
    where: {
      gameType_weekStart: {
        gameType: GAME_TYPE_MAP[slug],
        weekStart,
      },
    },
    create: {
      gameType: GAME_TYPE_MAP[slug],
      weekStart,
    },
    update: {
      reviewedAt: new Date(),
    },
  });
}

export {
  formatDisplayDate,
  formatWeekLabel,
  listRecentWeekStarts,
  getBetWeekStart,
} from "./week-utils";
