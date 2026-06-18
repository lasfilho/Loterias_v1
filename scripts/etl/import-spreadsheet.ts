import "dotenv/config";
import * as path from "node:path";
import { GAME_SLUGS, type GameSlug } from "../../src/modules/shared/constants";
import {
  importAllSpreadsheets,
  importSpreadsheet,
} from "../../src/modules/shared/etl/services/spreadsheet-import.service";

function printResult(
  slug: string,
  result: Awaited<ReturnType<typeof importSpreadsheet>>
) {
  console.log(
    `✓ ${slug}: +${result.contestsAdded} novos, ~${result.contestsUpdated} atualizados, ` +
      `${result.contestsSkipped} ignorados, ${result.contestsFailed} falhas | ` +
      `total=${result.contestsTotal} | status=${result.status} | batch=${result.batchId}`
  );
  if (result.errors.length > 0) {
    console.log("  Erros (primeiros 5):");
    result.errors.slice(0, 5).forEach((e) =>
      console.log(`    linha/concurso ${e.contestNumber} [${e.stage}]: ${e.message}`)
    );
  }
}

async function main() {
  const slugArg = process.argv[2] as GameSlug | "all" | undefined;
  const fileArg = process.argv[3];
  const forceUpdate = process.argv.includes("--force");

  const slugs: GameSlug[] =
    !slugArg || slugArg === "all" ? [...GAME_SLUGS] : [slugArg];

  if (slugArg && slugArg !== "all" && !GAME_SLUGS.includes(slugArg as GameSlug)) {
    console.error(
      `Uso: tsx scripts/etl/import-spreadsheet.ts [${GAME_SLUGS.join("|")}|all] [arquivo.xlsx] [--force]`
    );
    process.exit(1);
  }

  console.log("=== Importação via planilha (formato Caixa) ===\n");

  if (!slugArg || slugArg === "all") {
    const results = await importAllSpreadsheets({
      forceUpdate,
      triggeredBy: "cli:import-spreadsheet",
    });
    for (const result of results) {
      printResult(result.gameSlug, result);
    }
  } else {
    const filePath = fileArg && !fileArg.startsWith("--")
      ? path.resolve(fileArg)
      : undefined;

    const result = await importSpreadsheet(slugArg, {
      filePath,
      forceUpdate,
      triggeredBy: "cli:import-spreadsheet",
    });
    printResult(slugArg, result);
  }

  console.log("\nImportação concluída.");
  console.log("Próximo passo: npm run etl:sync  (busca só concursos novos na API)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
