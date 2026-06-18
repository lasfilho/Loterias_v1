# Skill: Probabilistic Analysis

## Objetivo

Implementar análises **probabilísticas e estatísticas** sobre sorteios históricos (frequência, atraso, tendência, pares, paridade) de forma interpretável e ética, alimentando palpites sem prometer previsão.

## Responsabilidades

- Evoluir `AnalyticsEngine` em `shared/analytics/analytics-engine.ts`
- Calcular métricas em `AnalyticsSummary`
- Suportar estratégias em `PredictionEngine` e `strategies/*`
- Documentar fórmulas em `docs/analytics/`
- Calibrar `confidence` como score relativo, não P(prêmio)

## Entradas

- `DrawRecord[]` ordenados (mais recente primeiro)
- `GameRules` (universo, drawCount)
- `DrawFilter` opcional
- Enum `PredictionStrategy`

## Saídas

- `AnalyticsSummary` completo
- `PredictionResult` com `numbers`, `strategy`, `confidence`, `metadata`
- Pesos por estratégia em `prediction_configs`

## Padrões

**Frequência:**

```
count(n) = aparições de n em todos os draws filtrados
pct(n) = count(n) / totalDraws × (drawCount / universe) normalizado
expected = totalDraws × drawCount / |universe|
deviation = count(n) - expected
```

**Atraso:**

```
delay(n) = concursos desde última aparição de n (0 se saiu no último)
```

**Hot/Cold:**

- Hot = top 20% por frequência
- Cold = bottom 20%

**Estratégias:**

| Strategy | Ideia |
|----------|-------|
| FREQUENCY_WEIGHTED | Sample ponderado por freq histórica |
| DELAY_BALANCED | Mix atraso + frequência |
| HOT_COLD_MIX | Alterna quentes e frios |
| PATTERN_AWARE | Respeita par/ímpar e faixas |
| HYBRID | Combina pesos configuráveis |

## Checklist

- [ ] Fórmulas usam apenas draws do jogo atual?
- [ ] Filtro reduz amostra corretamente?
- [ ] Palpite final passa `validateDraw`?
- [ ] `confidence` documentado como heurístico?
- [ ] Metadata registra estratégia e parâmetros?
- [ ] Copy/UI com disclaimer?

## Pitfalls

- **Tratar atraso como profecia** — falácia do jogador
- **Pares sem limite** — explosão combinatória em Lotofácil
- **Tendência com janela 2** — ruído puro
- **Normalizar entre jogos** — proibido em métricas agregadas
- **Random sem seed em testes** — palpites não reproduzíveis

## Exemplos práticos

**Compute summary:**

```typescript
const engine = new AnalyticsEngine(GAMES.quina, draws);
const summary = engine.compute({ fromContest: 1, toContest: 500 });
console.log(summary.hotNumbers); // top ~20% de 80 dezenas
```

**Gerar palpite:**

```typescript
const result = predictionEngine.generate(rules, draws, PredictionStrategy.HYBRID, config);
// result.numbers.length === 5 para Quina
```

**Interpretação correta na UI:**

> "Números com maior frequência histórica na amostra selecionada (N concursos). Isso não altera a probabilidade oficial do próximo sorteio."
