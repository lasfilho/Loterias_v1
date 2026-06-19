"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { BetPickerModal } from "@/components/domain/bet-picker-modal";
import { CompactVolanteCard } from "@/components/domain/compact-volante-card";
import {
  getConferenceBoardClass,
  getConferenceDayClass,
} from "@/components/domain/volante-layout";
import {
  WEEKDAY_SHORT,
} from "@/modules/shared/weekly-bet/constants";
import type { GameSlug } from "@/modules/shared/constants";
import type {
  ConferenceCheckView,
  ConferenceDayView,
  ConferenceWeekView,
  SavedBetView,
} from "@/modules/shared/weekly-bet/types";
import { getGameTheme } from "@/lib/game-theme";
import { getCheckStatusShortLabel } from "@/modules/shared/weekly-bet/status-messages";
import { cn } from "@/lib/utils";

interface ConferenceWeekBoardProps {
  conference: ConferenceWeekView;
  onAssign: (
    weekday: number,
    betSlot: number,
    predictionId: string
  ) => Promise<void>;
  assigning?: boolean;
}

function CompactSlot({
  check,
  game,
  bets,
  onAssign,
  assigning,
  showSlotIndex,
}: {
  check: ConferenceCheckView;
  game: GameSlug;
  bets: SavedBetView[];
  onAssign: (
    weekday: number,
    betSlot: number,
    predictionId: string
  ) => Promise<void>;
  assigning?: boolean;
  showSlotIndex: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const theme = getGameTheme(game);

  const handleSelect = async (predictionId: string) => {
    await onAssign(check.weekday, check.betSlot, predictionId);
    setModalOpen(false);
  };

  return (
    <>
      <CompactVolanteCard
        game={game}
        selectedNumbers={check.betNumbers}
        matchedNumbers={check.matchedNumbers}
        drawNumbers={check.drawNumbers}
        dashed={!check.assigned}
        interactive
        onClick={() => setModalOpen(true)}
        disabled={assigning}
        label={
          showSlotIndex ? (
            <span>Jogo {check.betSlot}</span>
          ) : undefined
        }
        footer={
          <>
            {check.assigned && check.hits !== null && (
              <p
                className={cn(
                  "text-[10px] font-bold text-center mt-1.5 tabular-nums",
                  check.isPrizeEligible
                    ? theme.prizeHits
                    : "text-muted-foreground"
                )}
              >
                {check.hits} ac.
              </p>
            )}
            {check.assigned && check.status !== "checked" && check.statusMessage && (
              <p
                className={cn(
                  "text-[9px] text-center mt-1.5 leading-snug px-1",
                  check.status === "not_found"
                    ? "text-muted-foreground"
                    : "text-amber-600 dark:text-amber-400"
                )}
              >
                {check.statusMessage}
              </p>
            )}
            {!check.assigned && (
              <p className="text-[9px] text-center text-muted-foreground mt-1.5 flex items-center justify-center gap-0.5">
                <Plus className="h-2.5 w-2.5" />
                Escolher
              </p>
            )}
          </>
        }
        title={
          check.assigned
            ? `${check.hits ?? 0} acertos — clique para trocar`
            : "Escolher jogo salvo"
        }
      />

      <BetPickerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        game={game}
        bets={bets}
        weekdayLabel={check.weekdayLabel}
        betSlot={check.betSlot}
        onSelect={handleSelect}
        selecting={assigning}
      />
    </>
  );
}

function DayColumn({
  day,
  game,
  bets,
  onAssign,
  assigning,
  betCount,
}: {
  day: ConferenceDayView;
  game: GameSlug;
  bets: SavedBetView[];
  onAssign: (
    weekday: number,
    betSlot: number,
    predictionId: string
  ) => Promise<void>;
  assigning?: boolean;
  betCount: number;
}) {
  const shortLabel = WEEKDAY_SHORT[day.weekday] ?? day.weekdayLabel.slice(0, 3);
  const dateLabel = new Date(day.expectedDate + "T12:00:00").toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "2-digit" }
  );
  const dayChecks = day.checks.filter((c) => c.assigned);
  const allChecked =
    dayChecks.length > 0 && dayChecks.every((c) => c.status === "checked");
  const pendingCheck = dayChecks.find(
    (c) => c.status === "awaiting" || c.status === "future"
  );
  const dayHint = allChecked
    ? null
    : pendingCheck?.statusMessage ??
      dayChecks.find((c) => c.status === "not_found")?.statusMessage;

  return (
    <div className={cn(getConferenceDayClass(game), "flex flex-col gap-1.5")}>
      <div className="text-center rounded-lg border border-border/60 p-2 bg-card/40">
        <p className="text-[10px] text-muted-foreground uppercase font-semibold">
          {shortLabel}
        </p>
        <p className="text-[9px] text-muted-foreground tabular-nums">{dateLabel}</p>
        {dayHint && (
          <p className="text-[8px] text-amber-600 dark:text-amber-400 mt-1 leading-tight px-0.5">
            {getCheckStatusShortLabel(pendingCheck?.status ?? "not_found")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full">
        {day.checks.map((check) => (
          <CompactSlot
            key={`${day.weekday}-${check.betSlot}`}
            check={check}
            game={game}
            bets={bets}
            onAssign={onAssign}
            assigning={assigning}
            showSlotIndex={betCount > 1}
          />
        ))}
      </div>
    </div>
  );
}

export function ConferenceWeekBoard({
  conference,
  onAssign,
  assigning,
}: ConferenceWeekBoardProps) {
  return (
    <div className={getConferenceBoardClass(conference.game)}>
      {conference.days.map((day) => (
        <DayColumn
          key={day.weekday}
          day={day}
          game={conference.game}
          bets={conference.bets}
          onAssign={onAssign}
          assigning={assigning}
          betCount={conference.betCount}
        />
      ))}
    </div>
  );
}
