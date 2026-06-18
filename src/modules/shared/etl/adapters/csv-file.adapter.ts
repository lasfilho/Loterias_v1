import { type DrawSourceAdapter } from "../types";

/**
 * Adapter placeholder para importação via CSV (fase futura).
 * Implementar leitura de arquivo e yield de RawDrawRecord por linha.
 */
export class CsvFileAdapter implements DrawSourceAdapter {
  readonly sourceCode = "CSV_IMPORT";

  constructor(
    private readonly filePath: string,
    private readonly _gameSlug: string
  ) {
    void this.filePath;
    void this._gameSlug;
  }

  async fetchLatestContest(): Promise<number> {
    throw new Error("CsvFileAdapter.fetchLatestContest não implementado");
  }

  async fetchContest(): Promise<null> {
    throw new Error("CsvFileAdapter.fetchContest não implementado");
  }
}
