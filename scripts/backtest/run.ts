import "dotenv/config";
import { GAME_SLUGS, type GameSlug } from "../../src/modules/shared/constants";
import { runBacktest } from "../../src/modules/shared/services/game-service";
import type { GenerationMode } from "../../src/modules/shared/prediction/types";

const slug = process.argv[2] as GameSlug;
const args = process.argv.slice(3);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : undefined;
}

const hasFlag = (name: string) => args.includes(`--${name}`);

async function main() {
  if (!slug || !GAME_SLUGS.includes(slug)) {
    console.error(
      "Uso: tsx scripts/backtest/run.ts <lotofacil|megasena|quina> [opções]"
    );
    console.error("  --window 50");
    console.error("  --train-min 80");
    console.error("  --from 1000 --to 2000");
    console.error("  --mode BALANCED|CONSERVATIVE|AGGRESSIVE");
    console.error("  --save");
    console.error("  --details");
    process.exit(1);
  }

  const result = await runBacktest(slug, {
    windowSize: getArg("window") ? Number(getArg("window")) : undefined,
    trainMinDraws: getArg("train-min") ? Number(getArg("train-min")) : undefined,
    fromContest: getArg("from") ? Number(getArg("from")) : undefined,
    toContest: getArg("to") ? Number(getArg("to")) : undefined,
    mode: getArg("mode") as GenerationMode | undefined,
    persist: hasFlag("save"),
    persistDetails: hasFlag("details"),
    triggeredBy: "cli",
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
