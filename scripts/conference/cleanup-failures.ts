import "dotenv/config";
import { cleanupStaleConferenceRecords } from "../../src/modules/shared/weekly-bet/conference.service";
import { type GameSlug, isGameSlug } from "../../src/modules/shared/constants";

async function main() {
  const arg = process.argv[2];

  if (arg && arg !== "all" && !isGameSlug(arg)) {
    console.error(`Jogo inválido: ${arg}. Use lotofacil | megasena | quina | all`);
    process.exit(1);
  }

  if (!arg || arg === "all") {
    const games: GameSlug[] = ["lotofacil", "megasena", "quina"];
    let totalChecks = 0;
    let totalBatches = 0;

    for (const game of games) {
      const result = await cleanupStaleConferenceRecords(game);
      console.log(
        `[${game}] checks resetados: ${result.checksReset}, batches removidos: ${result.batchesRemoved}`
      );
      totalChecks += result.checksReset;
      totalBatches += result.batchesRemoved;
    }

    console.log(
      `Total: ${totalChecks} conferências corrigidas, ${totalBatches} lotes de importação removidos`
    );
    return;
  }

  const game = arg as GameSlug;
  const result = await cleanupStaleConferenceRecords(game);
  console.log(
    `[${game}] checks resetados: ${result.checksReset}, batches removidos: ${result.batchesRemoved}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
