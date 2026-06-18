import "dotenv/config";
import { GAME_SLUGS, type GameSlug } from "../../src/modules/shared/constants";
import { resolveIngestionService } from "../../src/modules/shared/etl/ingestion-registry";

async function main() {
  const slug = process.argv[2] as GameSlug | undefined;
  const from = parseInt(process.argv[3] ?? "", 10);
  const to = parseInt(process.argv[4] ?? "", 10);

  if (!slug || !GAME_SLUGS.includes(slug) || !from || !to) {
    console.error(
      `Uso: tsx scripts/etl/reprocess.ts <${GAME_SLUGS.join("|")}> <fromContest> <toContest>`
    );
    process.exit(1);
  }

  console.log(`Reprocessando ${slug} concursos ${from}–${to}...\n`);

  const result = await resolveIngestionService(slug).runReprocess(from, to, {
    triggeredBy: "cli:reprocess",
  });

  console.log(
    `Status: ${result.status}\n` +
      `Novos: ${result.contestsAdded} | Atualizados: ${result.contestsUpdated} | ` +
      `Ignorados: ${result.contestsSkipped} | Falhas: ${result.contestsFailed}\n` +
      `Batch: ${result.batchId}`
  );

  if (result.errors.length > 0) {
    console.log("\nErros:");
    result.errors.forEach((e) =>
      console.log(`  #${e.contestNumber} [${e.stage}]: ${e.message}`)
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
