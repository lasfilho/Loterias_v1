import * as path from "node:path";
import { ImportStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGameRules, GAME_SLUGS, type GameSlug } from "../../constants";
import { getRepository } from "../../repository/registry";
import { readCaixaSpreadsheet } from "../parsers/caixa-spreadsheet.parser";
import { mapSpreadsheetRowToNormalized } from "../mappers/spreadsheet-draw.mapper";
import { validateNormalizedDraw } from "../validators/draw.validator";
import {
  type ContestProcessingError,
  type IngestionResult,
} from "../types";

export const CSV_SOURCE_CODE = "CSV_IMPORT";

const DEFAULT_PATHS: Record<GameSlug, string> = {
  lotofacil: "data/import/lotofacil.xlsx",
  megasena: "data/import/megasena.xlsx",
  quina: "data/import/quina.xlsx",
};

export interface SpreadsheetImportOptions {
  filePath?: string;
  forceUpdate?: boolean;
  triggeredBy?: string;
}

export async function importSpreadsheet(
  slug: GameSlug,
  options: SpreadsheetImportOptions = {}
): Promise<IngestionResult> {
  const startedAt = Date.now();
  const rules = getGameRules(slug);
  const filePath = path.resolve(
    options.filePath ?? DEFAULT_PATHS[slug]
  );

  const dataSource = await prisma.dataSource.findUnique({
    where: { code: CSV_SOURCE_CODE },
  });
  if (!dataSource) {
    throw new Error(
      `Fonte ${CSV_SOURCE_CODE} não encontrada. Execute: npm run db:seed`
    );
  }

  const rows = readCaixaSpreadsheet(filePath);
  const repo = getRepository(slug);

  const contestNumbers = rows
    .map((row) => {
      const raw = row.Concurso ?? row.concurso;
      return parseInt(String(raw ?? ""), 10);
    })
    .filter((n) => !Number.isNaN(n));

  const fromContest = contestNumbers.length > 0 ? Math.min(...contestNumbers) : 1;
  const toContest = contestNumbers.length > 0 ? Math.max(...contestNumbers) : 1;

  const batch = await prisma.importBatch.create({
    data: {
      gameType: rules.gameType,
      dataSourceId: dataSource.id,
      status: ImportStatus.RUNNING,
      triggeredBy: options.triggeredBy ?? "cli:import-spreadsheet",
      fromContest,
      toContest,
      fileName: path.basename(filePath),
    },
  });

  const errors: ContestProcessingError[] = [];
  let contestsAdded = 0;
  let contestsUpdated = 0;
  let contestsSkipped = 0;
  let contestsFailed = 0;
  let lastContestProcessed: number | null = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowLabel = i + 2;

    try {
      const transformed = mapSpreadsheetRowToNormalized(rules, row);
      if (!transformed.success || !transformed.draw) {
        contestsFailed++;
        errors.push({
          contestNumber: rowLabel,
          stage: "transform",
          message: transformed.errors.join("; "),
        });
        continue;
      }

      const draw = transformed.draw;
      const validation = validateNormalizedDraw(rules, draw);
      if (!validation.valid) {
        contestsFailed++;
        errors.push({
          contestNumber: draw.contestNumber,
          stage: "validate",
          message: validation.errors.join("; "),
        });
        continue;
      }

      const exists = await repo.contestExists(draw.contestNumber);
      if (exists && !options.forceUpdate) {
        contestsSkipped++;
        continue;
      }

      const outcome = await repo.upsertWithContext({
        draw,
        importBatchId: batch.id,
        dataSourceId: dataSource.id,
        rawPayload: row,
      });

      if (outcome === "created") contestsAdded++;
      else contestsUpdated++;

      lastContestProcessed = draw.contestNumber;

      if ((i + 1) % 200 === 0) {
        process.stdout.write(
          `  ${slug}: ${i + 1}/${rows.length} linhas\r`
        );
      }
    } catch (error) {
      contestsFailed++;
      errors.push({
        contestNumber: rowLabel,
        stage: "load",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const contestsTotal = await repo.count();
  const importStatus = resolveImportStatus(
    contestsFailed,
    contestsAdded + contestsUpdated
  );

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: importStatus,
      finishedAt: new Date(),
      contestsAdded,
      contestsUpdated,
      contestsSkipped,
      contestsFailed,
      contestsTotal,
      lastContestProcessed,
      errorMessage:
        errors.length > 0 ? `${errors.length} linha(s) com falha` : null,
      metadata: JSON.parse(
        JSON.stringify({
          filePath,
          rowsRead: rows.length,
          errors: errors.slice(0, 100),
        })
      ),
    },
  });

  return {
    batchId: batch.id,
    gameSlug: slug,
    mode: "full",
    status: importStatus,
    fromContest,
    toContest,
    contestsAdded,
    contestsUpdated,
    contestsSkipped,
    contestsFailed,
    contestsTotal,
    lastContestProcessed,
    errors,
    durationMs: Date.now() - startedAt,
  };
}

export async function importAllSpreadsheets(
  options: Omit<SpreadsheetImportOptions, "filePath"> & {
    paths?: Partial<Record<GameSlug, string>>;
  } = {}
): Promise<IngestionResult[]> {
  const results: IngestionResult[] = [];
  for (const slug of GAME_SLUGS) {
    results.push(
      await importSpreadsheet(slug, {
        ...options,
        filePath: options.paths?.[slug],
      })
    );
  }
  return results;
}

function resolveImportStatus(
  failed: number,
  succeeded: number
): IngestionResult["status"] {
  if (failed > 0 && succeeded === 0) return ImportStatus.FAILED;
  if (failed > 0) return ImportStatus.PARTIAL;
  return ImportStatus.SUCCESS;
}
