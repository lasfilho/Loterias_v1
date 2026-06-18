import { type GameSlug, isGameSlug } from "../constants";
import { type BaseIngestionService } from "../etl/services/base-ingestion.service";
import { lotofacilIngestion } from "../../lotofacil/ingestion.service";
import { megasenaIngestion } from "../../megasena/ingestion.service";
import { quinaIngestion } from "../../quina/ingestion.service";

const services: Record<GameSlug, BaseIngestionService> = {
  lotofacil: lotofacilIngestion,
  megasena: megasenaIngestion,
  quina: quinaIngestion,
};

export function getIngestionService(slug: GameSlug): BaseIngestionService {
  return services[slug];
}

export function resolveIngestionService(slug: string): BaseIngestionService {
  if (!isGameSlug(slug)) {
    throw new Error(`Modalidade inválida: ${slug}`);
  }
  return getIngestionService(slug);
}

export { lotofacilIngestion, megasenaIngestion, quinaIngestion };
