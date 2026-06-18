import "dotenv/config";
import { GAME_SLUGS, type GameSlug } from "../../src/modules/shared/constants";
import { resolveIngestionService } from "../../src/modules/shared/etl/ingestion-registry";

async function main() {
  const slugArg = process.argv[2] as GameSlug | "all" | undefined;
  const maxArg = process.argv[3];
  const maxContests = maxArg ? parseInt(maxArg, 10) : undefined;

  const slugs: GameSlug[] =
    !slugArg || slugArg === "all" ? [...GAME_SLUGS] : [slugArg];

  if (slugArg && slugArg !== "all" && !GAME_SLUGS.includes(slugArg as GameSlug)) {
    console.error(
      `Uso: tsx scripts/etl/incremental-sync.ts [${GAME_SLUGS.join("|")}|all] [maxContests]`
    );
    process.exit(1);
  }

  console.log("=== Atualização incremental ===\n");

  for (const slug of slugs) {
    console.log(`\n--- ${slug.toUpperCase()} ---`);
    try {
      const result = await resolveIngestionService(slug).runIncremental({
        maxContests,
        triggeredBy: "cli:incremental",
      });
      console.log(
        `✓ ${slug}: +${result.contestsAdded} novos | total=${result.contestsTotal} | ` +
          `status=${result.status} | ${result.durationMs}ms`
      );
    } catch (err) {
      console.error(`✗ ${slug}:`, err);
      process.exitCode = 1;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
