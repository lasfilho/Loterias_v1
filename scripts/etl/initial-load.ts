import "dotenv/config";
import { GAME_SLUGS, type GameSlug } from "../../src/modules/shared/constants";
import { resolveIngestionService } from "../../src/modules/shared/etl/ingestion-registry";

function printResult(slug: string, result: Awaited<ReturnType<ReturnType<typeof resolveIngestionService>["runFull"]>>) {
  console.log(
    `✓ ${slug}: +${result.contestsAdded} novos, ~${result.contestsUpdated} atualizados, ` +
      `${result.contestsSkipped} ignorados, ${result.contestsFailed} falhas | ` +
      `total=${result.contestsTotal} | status=${result.status} | batch=${result.batchId}`
  );
  if (result.errors.length > 0) {
    console.log(`  Erros (primeiros 5):`);
    result.errors.slice(0, 5).forEach((e) =>
      console.log(`    concurso ${e.contestNumber} [${e.stage}]: ${e.message}`)
    );
  }
}

async function main() {
  const slugArg = process.argv[2] as GameSlug | "all" | undefined;
  const maxArg = process.argv[3];
  const maxContests = maxArg ? parseInt(maxArg, 10) : undefined;

  const slugs: GameSlug[] =
    !slugArg || slugArg === "all" ? [...GAME_SLUGS] : [slugArg];

  if (slugArg && slugArg !== "all" && !GAME_SLUGS.includes(slugArg as GameSlug)) {
    console.error(
      `Uso: tsx scripts/etl/initial-load.ts [${GAME_SLUGS.join("|")}|all] [maxContests]`
    );
    process.exit(1);
  }

  console.log("=== Carga histórica completa (modo full) ===\n");

  for (const slug of slugs) {
    console.log(`\n--- ${slug.toUpperCase()} ---`);
    try {
      const service = resolveIngestionService(slug);
      const result = await service.runFull({
        maxContests,
        triggeredBy: "cli:initial-load",
      });
      printResult(slug, result);
    } catch (err) {
      console.error(`✗ ${slug} falhou:`, err);
      process.exitCode = 1;
    }
  }

  console.log("\nCarga inicial concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
