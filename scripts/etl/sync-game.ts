import "dotenv/config";
import { resolveIngestionService } from "../../src/modules/shared/etl/ingestion-registry";
import { GAME_SLUGS, type GameSlug } from "../../src/modules/shared/constants";

async function main() {
  const slug = process.argv[2] as GameSlug | undefined;
  const maxArg = process.argv[3];
  const maxContests = maxArg ? parseInt(maxArg, 10) : undefined;

  if (!slug || !GAME_SLUGS.includes(slug)) {
    console.error(`Usage: tsx scripts/etl/sync-game.ts <${GAME_SLUGS.join("|")}> [maxContests]`);
    process.exit(1);
  }

  console.log(`Sync incremental: ${slug}...`);
  const result = await resolveIngestionService(slug).runIncremental({
    maxContests,
    triggeredBy: "cli:sync-game",
  });
  console.log(
    `Done: +${result.contestsAdded} novos, total=${result.contestsTotal}, ` +
      `last=${result.lastContestProcessed}, status=${result.status}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
