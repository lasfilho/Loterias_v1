import { Suspense } from "react";
import ConferenciaContent from "./conferencia-content";

export default function ConferenciaPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-muted-foreground text-sm">
          Carregando...
        </div>
      }
    >
      <ConferenciaContent />
    </Suspense>
  );
}
