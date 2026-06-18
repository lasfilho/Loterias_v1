import { type GameRules } from "../constants";
import { type CaixaDrawResponse, type NormalizedDraw } from "../types";

/** Payload bruto genérico — cada adapter define o formato concreto */
export interface RawDrawRecord {
  sourceCode: string;
  contestNumber: number;
  payload: unknown;
}

export interface DrawSourceAdapter {
  readonly sourceCode: string;
  fetchLatestContest(): Promise<number>;
  fetchContest(contestNumber: number): Promise<RawDrawRecord | null>;
}

export type IngestionMode = "full" | "incremental" | "reprocess";

export interface IngestionOptions {
  mode?: IngestionMode;
  fromContest?: number;
  toContest?: number;
  /** Limita o concurso máximo (útil para testes) */
  maxContests?: number;
  /** Reprocessa concursos já existentes (atualiza registros) */
  forceUpdate?: boolean;
  throttleMs?: number;
  triggeredBy?: string;
  dataSourceCode?: string;
}

export interface ContestProcessingError {
  contestNumber: number;
  stage: "extract" | "validate" | "transform" | "load";
  message: string;
}

export interface IngestionResult {
  batchId: string;
  gameSlug: string;
  mode: IngestionMode;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  fromContest: number;
  toContest: number;
  contestsAdded: number;
  contestsUpdated: number;
  contestsSkipped: number;
  contestsFailed: number;
  contestsTotal: number;
  lastContestProcessed: number | null;
  errors: ContestProcessingError[];
  durationMs: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TransformResult {
  success: boolean;
  draw?: NormalizedDraw;
  rawPayload?: CaixaDrawResponse;
  errors: string[];
}

export interface LoadDrawInput {
  draw: NormalizedDraw;
  importBatchId: string;
  dataSourceId: string;
  rawPayload?: unknown;
}

export interface EtlPipelineDeps {
  rules: GameRules;
  adapter: DrawSourceAdapter;
  load: (input: LoadDrawInput) => Promise<"created" | "updated">;
  contestExists: (contestNumber: number) => Promise<boolean>;
  getLatestContest: () => Promise<number | null>;
  countDraws: () => Promise<number>;
}
