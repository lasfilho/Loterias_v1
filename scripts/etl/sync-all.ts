import "dotenv/config";
import { GAME_SLUGS } from "../../src/modules/shared/constants";
import { resolveIngestionService } from "../../src/modules/shared/etl/ingestion-registry";

async function main() {
  const maxArg = process.argv[2];
  const maxContests = maxArg ? parseInt(maxArg, 10) : undefined;

  console.log("Sync incremental — todos os jogos\n");

  for (const slug of GAME_SLUGS) {
    console.log(`=== ${slug.toUpperCase()} ===`);
    try {
      const result = await resolveIngestionService(slug).runIncremental({
        maxContests,
        triggeredBy: "cli:sync-all",
      });
      console.log(
        `✓ +${result.contestsAdded} | total=${result.contestsTotal} | status=${result.status}\n`
      );
    } catch (err) {
      console.error(`✗ ${slug}:`, err);
    }
  }

  console.log("Sync complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
