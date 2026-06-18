import { type GameRules } from "../../constants";
import { type CaixaDrawResponse } from "../../types";
import { sleep } from "@/lib/utils";
import { type DrawSourceAdapter, type RawDrawRecord } from "../types";

const CAIXA_API_BASE =
  "https://servicebus2.caixa.gov.br/portaldeloterias/api";

export const CAIXA_SOURCE_CODE = "CAIXA_API";

export interface CaixaAdapterOptions {
  maxRetries?: number;
  retryDelayMs?: number;
}

export class CaixaApiAdapter implements DrawSourceAdapter {
  readonly sourceCode = CAIXA_SOURCE_CODE;

  constructor(
    private readonly rules: GameRules,
    private readonly options: CaixaAdapterOptions = {}
  ) {}

  async fetchLatestContest(): Promise<number> {
    const data = await this.fetchJson<CaixaDrawResponse>(
      `${CAIXA_API_BASE}/${this.rules.apiSlug}`
    );
    return data.numero;
  }

  async fetchContest(contestNumber: number): Promise<RawDrawRecord | null> {
    const url = `${CAIXA_API_BASE}/${this.rules.apiSlug}/${contestNumber}`;
    const res = await this.fetchWithRetry(url, { allowNotFound: true });
    if (res === null) return null;

    const payload = res as CaixaDrawResponse;
    if (payload.numero !== contestNumber) {
      payload.numero = contestNumber;
    }

    return {
      sourceCode: this.sourceCode,
      contestNumber,
      payload,
    };
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const data = await this.fetchWithRetry(url);
    if (data === null) {
      throw new Error(`Caixa API: recurso não encontrado (${url})`);
    }
    return data as T;
  }

  private async fetchWithRetry(
    url: string,
    opts: { allowNotFound?: boolean } = {}
  ): Promise<unknown | null> {
    const maxRetries = this.options.maxRetries ?? 3;
    const retryDelayMs = this.options.retryDelayMs ?? 500;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });

        if (res.status === 404 && opts.allowNotFound) return null;

        if (res.status === 429 || res.status >= 500) {
          throw new Error(`Caixa API HTTP ${res.status}`);
        }

        if (!res.ok) {
          throw new Error(`Caixa API HTTP ${res.status} — ${url}`);
        }

        return await res.json();
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          await sleep(retryDelayMs * attempt);
        }
      }
    }

    throw lastError ?? new Error("Caixa API: falha desconhecida");
  }
}

export function createCaixaAdapter(
  rules: GameRules,
  options?: CaixaAdapterOptions
): CaixaApiAdapter {
  return new CaixaApiAdapter(rules, options);
}
