"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DrawNumbers } from "@/components/domain/number-ball";
import { GAMES, type GameSlug } from "@/modules/shared/constants";
import type { SavedBetView } from "@/modules/shared/weekly-bet/types";
import { PREDICTION_STRATEGIES } from "@/modules/shared/constants";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface BetPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: GameSlug;
  bets: SavedBetView[];
  weekdayLabel: string;
  betSlot: number;
  onSelect: (predictionId: string) => void;
  selecting?: boolean;
}

export function BetPickerModal({
  open,
  onOpenChange,
  game,
  bets,
  weekdayLabel,
  betSlot,
  onSelect,
  selecting = false,
}: BetPickerModalProps) {
  const rules = GAMES[game];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Escolher jogo salvo</DialogTitle>
          <DialogDescription>
            {weekdayLabel} · Cartão {betSlot} — selecione um dos jogos salvos
            nesta semana.
          </DialogDescription>
        </DialogHeader>

        {bets.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Nenhum jogo salvo para {rules.name} nesta semana.
            </p>
            <Button asChild variant="outline">
              <Link href={`/palpites?game=${game}`}>Ir para Palpites</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bets.map((bet) => (
              <button
                key={bet.id}
                type="button"
                disabled={selecting}
                onClick={() => onSelect(bet.id)}
                className="w-full text-left rounded-xl border border-border p-4 hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-sm font-semibold">
                    Jogo salvo #{bet.betSlot}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(bet.savedAt)}
                  </span>
                </div>
                <DrawNumbers numbers={bet.numbers} color={rules.color} />
                <p className="text-xs text-muted-foreground mt-2">
                  {PREDICTION_STRATEGIES.find((s) => s.value === bet.strategy)
                    ?.label ?? bet.strategy}
                </p>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
