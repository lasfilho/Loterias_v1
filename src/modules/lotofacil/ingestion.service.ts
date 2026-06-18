import { BaseIngestionService, createCaixaIngestionAdapter } from "../shared/etl/services/base-ingestion.service";
import { type DrawSourceAdapter } from "../shared/etl/types";
import { LotofacilRepository } from "./repository";

export class LotofacilIngestionService extends BaseIngestionService {
  readonly slug = "lotofacil" as const;
  protected readonly repository = new LotofacilRepository();

  protected createAdapter(): DrawSourceAdapter {
    return createCaixaIngestionAdapter("lotofacil");
  }
}

export const lotofacilIngestion = new LotofacilIngestionService();
