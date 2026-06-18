import { BaseIngestionService, createCaixaIngestionAdapter } from "../shared/etl/services/base-ingestion.service";
import { type DrawSourceAdapter } from "../shared/etl/types";
import { QuinaRepository } from "./repository";

export class QuinaIngestionService extends BaseIngestionService {
  readonly slug = "quina" as const;
  protected readonly repository = new QuinaRepository();

  protected createAdapter(): DrawSourceAdapter {
    return createCaixaIngestionAdapter("quina");
  }
}

export const quinaIngestion = new QuinaIngestionService();
