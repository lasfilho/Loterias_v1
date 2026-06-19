"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CompactVolanteCard } from "@/components/domain/compact-volante-card";
import { GAMES, type GameSlug } from "@/modules/shared/constants";
import { getGameTheme } from "@/lib/game-theme";
import type { SavedBetView } from "@/modules/shared/weekly-bet/types";
import { formatDate, cn } from "@/lib/utils";
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
  const theme = getGameTheme(game);

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
            <Button asChild variant="outline" className={theme.outlineButton}>
              <Link href={`/palpites?game=${game}`}>Ir para Palpites</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {bets.map((bet) => (
              <button
                key={bet.id}
                type="button"
                disabled={selecting}
                onClick={() => onSelect(bet.id)}
                className={cn(
                  "w-full text-left rounded-lg border border-border/60 bg-card/40 p-2 transition-all disabled:opacity-50",
                  theme.pickerItemHover
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
                  <span className="text-[10px] font-semibold">
                    Jogo #{bet.betSlot}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {formatDate(bet.savedAt)}
                  </span>
                </div>
                <CompactVolanteCard game={game} selectedNumbers={bet.numbers} />
              </button>
            ))}
            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/40">
              Toque em um cartão para associar ao dia selecionado.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
