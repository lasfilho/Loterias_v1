"use client";

import { Label, Select } from "@/components/ui/input";
import { GAMES, GAME_SLUGS, type GameSlug } from "@/modules/shared/constants";
import { getGameTheme } from "@/lib/game-theme";
import { cn } from "@/lib/utils";

interface GameModalitySelectProps {
  value: GameSlug;
  onChange: (game: GameSlug) => void;
  id?: string;
  label?: string;
  labelClassName?: string;
  className?: string;
  showLabel?: boolean;
}

export function GameModalitySelect({
  value,
  onChange,
  id = "game-modality",
  label = "Modalidade",
  labelClassName,
  className,
  showLabel = true,
}: GameModalitySelectProps) {
  const theme = getGameTheme(value);

  return (
    <div className={className}>
      {showLabel && (
        <Label htmlFor={id} className={labelClassName}>
          {label}
        </Label>
      )}
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as GameSlug)}
        className={cn("mt-1.5", theme.selectField)}
      >
        {GAME_SLUGS.map((slug) => (
          <option key={slug} value={slug}>
            {GAMES[slug].name}
          </option>
        ))}
      </Select>
    </div>
  );
}
