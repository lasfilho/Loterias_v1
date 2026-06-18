import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ANALYTICS_LIMITATIONS } from "@/modules/shared/analytics/types";

const METHODOLOGY = [
  {
    title: "Frequência e atraso",
    body: "Frequência mede ocorrências históricas por dezena. Atraso indica quantos concursos se passaram desde a última aparição. Ambos são descritivos — não alteram a probabilidade oficial do próximo sorteio.",
  },
  {
    title: "Tendências multi-horizonte",
    body: "Comparam taxas recentes (janela curta) com a taxa histórica (janela longa). Direção up/down/stable indica desvio relativo, não previsão garantida.",
  },
  {
    title: "Score composto e backtest",
    body: "Scores combinam frequência, atraso, tendência e desvio em um ranking heurístico. Backtests simulam estratégias no passado para comparação relativa — sujeitos a overfitting.",
  },
  {
    title: "Monte Carlo",
    body: "Simulações com distribuição uniforme simplificada para estimar distribuição de acertos esperada em cenário aleatório de referência.",
  },
];

export function MethodologyAccordion() {
  return (
    <Accordion type="single" collapsible className="glass rounded-xl px-4">
      <AccordionItem value="limitations">
        <AccordionTrigger>Limitações e avisos</AccordionTrigger>
        <AccordionContent>
          <ul className="list-disc pl-4 space-y-2">
            {ANALYTICS_LIMITATIONS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
      {METHODOLOGY.map((item) => (
        <AccordionItem key={item.title} value={item.title}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>{item.body}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
