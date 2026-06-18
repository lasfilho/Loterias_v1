import { type GameRules } from "../shared/constants";
import { type DrawRecord } from "../shared/repository/base-repository";
import { BacktestEngine } from "../shared/backtest/backtest-engine";
import type { BacktestReport, BacktestRequest } from "../shared/backtest/types";

export class LotofacilBacktestService {
  private readonly engine: BacktestEngine;

  constructor(rules: GameRules, draws: DrawRecord[]) {
    this.engine = new BacktestEngine(rules, draws);
  }

  run(request?: BacktestRequest): BacktestReport | null {
    return this.engine.run(request);
  }
}
