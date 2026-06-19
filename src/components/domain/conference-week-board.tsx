"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { BetPickerModal } from "@/components/domain/bet-picker-modal";
import { CompactVolanteGrid } from "@/components/domain/compact-volante-grid";
import {
  DAY_COLUMN_MIN_CLASS,
  WEEKDAY_SHORT,
  WEEK_DAYS_ROW_CLASS,
} from "@/modules/shared/weekly-bet/constants";
import type { GameSlug } from "@/modules/shared/constants";
import type {
  ConferenceCheckView,
  ConferenceDayView,
  ConferenceWeekView,
  SavedBetView,
} from "@/modules/shared/weekly-bet/types";
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

  const handleSelect = async (predictionId: string) => {
    await onAssign(check.weekday, check.betSlot, predictionId);
    setModalOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        disabled={assigning}
        title={
          check.assigned
            ? `${check.hits ?? 0} acertos — clique para trocar`
            : "Escolher jogo salvo"
        }
        className={cn(
          "group w-full rounded-lg border border-border/60 bg-card/50 p-1.5 transition-all",
          "hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !check.assigned && "border-dashed",
          assigning && "pointer-events-none opacity-50"
        )}
      >
        {showSlotIndex && (
          <p className="text-[9px] text-center text-muted-foreground mb-1 font-medium">
            Jogo {check.betSlot}
          </p>
        )}

        <CompactVolanteGrid
          game={game}
          selectedNumbers={check.betNumbers}
          matchedNumbers={check.matchedNumbers}
          drawNumbers={check.drawNumbers}
        />

        {check.assigned && check.hits !== null && (
          <p
            className={cn(
              "text-[10px] font-bold text-center mt-1.5 tabular-nums",
              check.isPrizeEligible
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
            )}
          >
            {check.hits} ac.
          </p>
        )}

        {!check.assigned && (
          <p className="text-[9px] text-center text-muted-foreground mt-1.5 flex items-center justify-center gap-0.5">
            <Plus className="h-2.5 w-2.5" />
            Escolher
          </p>
        )}
      </button>

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

  return (
    <div className={cn(DAY_COLUMN_MIN_CLASS, "flex flex-col gap-1.5")}>
      <div className="text-center rounded-lg border border-border/60 p-2 bg-card/40">
        <p className="text-[10px] text-muted-foreground uppercase font-semibold">
          {shortLabel}
        </p>
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
    <div className={WEEK_DAYS_ROW_CLASS}>
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
