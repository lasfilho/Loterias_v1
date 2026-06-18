import { BaseIngestionService, createCaixaIngestionAdapter } from "../shared/etl/services/base-ingestion.service";
import { type DrawSourceAdapter } from "../shared/etl/types";
import { MegasenaRepository } from "./repository";

export class MegasenaIngestionService extends BaseIngestionService {
  readonly slug = "megasena" as const;
  protected readonly repository = new MegasenaRepository();

  protected createAdapter(): DrawSourceAdapter {
    return createCaixaIngestionAdapter("megasena");
  }
}

export const megasenaIngestion = new MegasenaIngestionService();
