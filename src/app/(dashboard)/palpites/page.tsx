import { Suspense } from "react";
import PalpitesPage from "./palpites-content";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Carregando...</div>}>
      <PalpitesPage />
    </Suspense>
  );
}
