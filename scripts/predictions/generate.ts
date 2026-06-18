/**
 * Script CLI para gerar palpites via terminal.
 * Uso: npx tsx scripts/predictions/generate.ts lotofacil --strategy HYBRID --mode BALANCED --save
 */
import "dotenv/config";
import {
  comparePredictionStrategies,
  generatePredictions,
} from "../../src/modules/shared/services/game-service";
import type { GameSlug } from "../../src/modules/shared/constants";
import { GAME_SLUGS } from "../../src/modules/shared/constants";
import type {
  GenerationMode,
  GenerationStrategy,
} from "../../src/modules/shared/prediction/types";

const slug = process.argv[2] as GameSlug;
const args = process.argv.slice(3);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : undefined;
}

const hasFlag = (name: string) => args.includes(`--${name}`);

async function main() {
  if (!slug || !GAME_SLUGS.includes(slug)) {
    console.error("Uso: tsx scripts/predictions/generate.ts <lotofacil|megasena|quina> [opções]");
    console.error("  --strategy HYBRID|FREQUENCY_WEIGHTED|...");
    console.error("  --mode CONSERVATIVE|BALANCED|AGGRESSIVE");
    console.error("  --batch 3");
    console.error("  --compare");
    console.error("  --save");
    process.exit(1);
  }

  const strategy = getArg("strategy") as GenerationStrategy | undefined;
  const mode = getArg("mode") as GenerationMode | undefined;
  const batchSize = getArg("batch") ? Number(getArg("batch")) : undefined;

  if (hasFlag("compare")) {
    const comparison = await comparePredictionStrategies(slug, { mode });
    console.log(JSON.stringify({ game: slug, comparison }, null, 2));
    return;
  }

  const result = await generatePredictions(slug, {
    strategy,
    mode,
    batchSize,
    persist: hasFlag("save"),
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
