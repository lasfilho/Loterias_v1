import { cn } from "@/lib/utils";

interface NumberBallProps {
  number: number;
  color?: string;
  size?: "sm" | "md";
  highlight?: "hot" | "cold" | "neutral";
}

export function NumberBall({
  number,
  color = "#8b5cf6",
  size = "md",
  highlight = "neutral",
}: NumberBallProps) {
  return (
    <span
      className={cn(
        "number-ball",
        size === "sm" && "number-ball-sm",
        highlight === "hot" && "ring-2 ring-amber-400/50",
        highlight === "cold" && "ring-2 ring-blue-400/50"
      )}
      style={{
        background: `linear-gradient(135deg, ${color}33, ${color}15)`,
        border: `1px solid ${color}44`,
        color: color,
      }}
    >
      {String(number).padStart(2, "0")}
    </span>
  );
}

interface NumberGridProps {
  numbers: number[];
  color?: string;
  hotNumbers?: number[];
  coldNumbers?: number[];
  maxNumber?: number;
  minNumber?: number;
}

export function NumberGrid({
  numbers,
  color = "#8b5cf6",
  hotNumbers = [],
  coldNumbers: _coldNumbers = [],
  maxNumber = 25,
  minNumber = 1,
}: NumberGridProps) {
  const allNumbers = Array.from(
    { length: maxNumber - minNumber + 1 },
    (_, i) => i + minNumber
  );

  return (
    <div className="flex flex-wrap gap-2">
      {allNumbers.map((n) => {
        const isDrawn = numbers.includes(n);
        const isHot = hotNumbers.includes(n);

        return (
          <span
            key={n}
            className={cn(
              "number-ball number-ball-sm transition-all",
              isDrawn && "scale-110",
              !isDrawn && "opacity-30"
            )}
            style={
              isDrawn
                ? {
                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                    border: `1px solid ${color}`,
                    color: "#fff",
                  }
                : {
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#71717a",
                  }
            }
          >
            {String(n).padStart(2, "0")}
            {isHot && isDrawn && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400" />
            )}
          </span>
        );
      })}
    </div>
  );
}

export function DrawNumbers({
  numbers,
  color = "#8b5cf6",
  size = "md",
}: {
  numbers: number[];
  color?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {numbers.map((n) => (
        <NumberBall key={n} number={n} color={color} size={size} />
      ))}
    </div>
  );
}
