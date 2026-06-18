import { type GameSlug } from "../constants";
import { LotofacilRepository } from "../../lotofacil/repository";
import { MegasenaRepository } from "../../megasena/repository";
import { QuinaRepository } from "../../quina/repository";
import { type GameRepository } from "./base-repository";

export function getRepository(slug: GameSlug): GameRepository {
  switch (slug) {
    case "lotofacil":
      return new LotofacilRepository();
    case "megasena":
      return new MegasenaRepository();
    case "quina":
      return new QuinaRepository();
  }
}
