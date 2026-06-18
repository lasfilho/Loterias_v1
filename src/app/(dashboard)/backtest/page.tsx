import { Suspense } from "react";
import BacktestPage from "./backtest-content";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Carregando…</div>}>
      <BacktestPage />
    </Suspense>
  );
}
