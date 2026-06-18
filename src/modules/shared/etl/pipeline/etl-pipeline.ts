import { ImportStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sleep } from "@/lib/utils";
import { type CaixaDrawResponse } from "../../types";
import { mapCaixaDrawToNormalized } from "../mappers/caixa-draw.mapper";
import {
  validateNormalizedDraw,
  validateRawRecord,
} from "../validators/draw.validator";
import { CAIXA_SOURCE_CODE } from "../adapters/caixa-api.adapter";
import {
  type ContestProcessingError,
  type EtlPipelineDeps,
  type IngestionOptions,
  type IngestionResult,
  type IngestionMode,
  type RawDrawRecord,
} from "../types";

const DEFAULT_THROTTLE_MS = 150;

export class EtlPipeline {
  constructor(private readonly deps: EtlPipelineDeps) {}

  async run(options: IngestionOptions = {}): Promise<IngestionResult> {
    const startedAt = Date.now();
    const mode = options.mode ?? "incremental";
    const throttleMs = options.throttleMs ?? DEFAULT_THROTTLE_MS;
    const dataSourceCode = options.dataSourceCode ?? CAIXA_SOURCE_CODE;

    const dataSource = await prisma.dataSource.findUnique({
      where: { code: dataSourceCode },
    });
    if (!dataSource) {
      throw new Error(
        `Fonte ${dataSourceCode} não encontrada. Execute: npm run db:seed`
      );
    }

    const batch = await prisma.importBatch.create({
      data: {
        gameType: this.deps.rules.gameType,
        dataSourceId: dataSource.id,
        status: "RUNNING",
        triggeredBy: options.triggeredBy ?? "cli",
      },
    });

    const errors: ContestProcessingError[] = [];
    let contestsAdded = 0;
    let contestsUpdated = 0;
    let contestsSkipped = 0;
    let contestsFailed = 0;
    let fromContest = 1;
    let toContest = 1;
    let lastContestProcessed: number | null = null;

    try {
      const latestRemote = await this.deps.adapter.fetchLatestContest();
      const range = await this.resolveRange(mode, latestRemote, options);
      fromContest = range.from;
      toContest = range.to;

      await prisma.importBatch.update({
        where: { id: batch.id },
        data: { fromContest, toContest },
      });

      if (fromContest <= toContest) {
        for (let contest = fromContest; contest <= toContest; contest++) {
          try {
            const outcome = await this.processContest(
              contest,
              batch.id,
              dataSource.id,
              options.forceUpdate ?? mode === "reprocess"
            );

            switch (outcome) {
              case "created":
                contestsAdded++;
                lastContestProcessed = contest;
                break;
              case "updated":
                contestsUpdated++;
                lastContestProcessed = contest;
                break;
              case "skipped":
                contestsSkipped++;
                break;
            }
          } catch (error) {
            contestsFailed++;
            errors.push(this.toError(contest, error));
          }

          if (contest % 50 === 0) {
            process.stdout.write(
              `  ${this.deps.rules.slug}: ${contest}/${toContest}\r`
            );
          }

          if (contest < toContest) {
            await sleep(throttleMs);
          }
        }
      }

      const contestsTotal = await this.deps.countDraws();
      const importStatus = this.resolveImportStatus(
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
            errors.length > 0
              ? `${errors.length} concurso(s) com falha`
              : null,
          metadata: JSON.parse(
            JSON.stringify({
              mode,
              errors: errors.slice(0, 100),
              durationMs: Date.now() - startedAt,
            })
          ) as Prisma.InputJsonValue,
        },
      });

      return {
        batchId: batch.id,
        gameSlug: this.deps.rules.slug,
        mode,
        status:
          importStatus === "SUCCESS"
            ? "SUCCESS"
            : importStatus === "PARTIAL"
              ? "PARTIAL"
              : "FAILED",
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
    } catch (error) {
      await prisma.importBatch.update({
        where: { id: batch.id },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          contestsAdded,
          contestsUpdated,
          contestsSkipped,
          contestsFailed,
          errorMessage:
            error instanceof Error ? error.message : "Falha fatal no pipeline",
          metadata: JSON.parse(
            JSON.stringify({ mode, errors: errors.slice(0, 100) })
          ) as Prisma.InputJsonValue,
        },
      });
      throw error;
    }
  }

  private async processContest(
    contestNumber: number,
    importBatchId: string,
    dataSourceId: string,
    forceUpdate: boolean
  ): Promise<"created" | "updated" | "skipped"> {
    let raw: RawDrawRecord | null;
    try {
      raw = await this.deps.adapter.fetchContest(contestNumber);
    } catch (error) {
      throw this.stageError("extract", error);
    }

    if (!raw) {
      return "skipped";
    }

    const rawValidation = validateRawRecord(this.deps.rules, raw);
    if (!rawValidation.valid) {
      throw new Error(`Validate: ${rawValidation.errors.join("; ")}`);
    }

    const transformed = mapCaixaDrawToNormalized(
      this.deps.rules,
      raw.payload as CaixaDrawResponse,
      contestNumber
    );
    if (!transformed.success || !transformed.draw) {
      throw new Error(`Transform: ${transformed.errors.join("; ")}`);
    }

    const normValidation = validateNormalizedDraw(
      this.deps.rules,
      transformed.draw
    );
    if (!normValidation.valid) {
      throw new Error(`Validate: ${normValidation.errors.join("; ")}`);
    }

    const exists = await this.deps.contestExists(contestNumber);
    if (exists && !forceUpdate) {
      return "skipped";
    }

    return this.deps.load({
      draw: transformed.draw,
      importBatchId,
      dataSourceId,
      rawPayload: transformed.rawPayload,
    }).catch((error) => {
      throw new Error(
        `load: ${error instanceof Error ? error.message : "falha"}`
      );
    });
  }

  private async resolveRange(
    mode: IngestionMode,
    latestRemote: number,
    options: IngestionOptions
  ): Promise<{ from: number; to: number }> {
    const cap = options.maxContests
      ? Math.min(latestRemote, options.maxContests)
      : latestRemote;

    if (mode === "reprocess") {
      const from = options.fromContest ?? 1;
      const to = options.toContest ?? cap;
      if (from > to) {
        throw new Error(`fromContest (${from}) maior que toContest (${to})`);
      }
      return { from, to };
    }

    if (mode === "full") {
      return {
        from: options.fromContest ?? 1,
        to: options.toContest ?? cap,
      };
    }

    const latestLocal = await this.deps.getLatestContest();
    const from = latestLocal ? latestLocal + 1 : 1;
    const to = options.toContest ?? cap;
    if (from > to) {
      return { from: 1, to: 0 };
    }
    return { from, to };
  }

  private resolveImportStatus(
    failed: number,
    succeeded: number
  ): ImportStatus {
    if (failed > 0 && succeeded === 0) return "FAILED";
    if (failed > 0) return "PARTIAL";
    return "SUCCESS";
  }

  private stageError(stage: ContestProcessingError["stage"], error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    const err = new Error(`${stage}: ${message}`);
    (err as Error & { stage: string }).stage = stage;
    return err;
  }

  private toError(
    contestNumber: number,
    error: unknown
  ): ContestProcessingError {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    const stage = message.startsWith("extract:")
      ? "extract"
      : message.startsWith("Validate:")
        ? "validate"
        : message.startsWith("Transform:")
          ? "transform"
          : message.startsWith("load:")
            ? "load"
            : "extract";

    return { contestNumber, stage, message };
  }
}
