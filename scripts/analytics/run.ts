import "dotenv/config";
import { GAME_SLUGS, type GameSlug } from "../../src/modules/shared/constants";
import { runAnalyticsPipeline } from "../../src/modules/shared/services/game-service";

async function main() {
  const slug = (process.argv[2] as GameSlug | "all") ?? "all";
  const slugs = slug === "all" ? [...GAME_SLUGS] : [slug];

  if (slug !== "all" && !GAME_SLUGS.includes(slug as GameSlug)) {
    console.error(`Uso: npm run analytics:run [${GAME_SLUGS.join("|")}|all]`);
    process.exit(1);
  }

  for (const game of slugs) {
    console.log(`\n=== Analytics: ${game} ===`);
    const { report, runId } = await runAnalyticsPipeline(game);
    console.log(
      `✓ ${report.totalDraws} concursos | run=${runId} | engine=${report.meta.engineVersion}`
    );
    console.log(`  Hot: ${report.hotNumbers.slice(0, 5).join(", ")}`);
    console.log(`  ${report.meta.disclaimer}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
