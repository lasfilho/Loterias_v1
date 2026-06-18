# Playbook: Add New Heuristic

## Objetivo

Adicionar uma **nova estratégia/heurística** de geração de palpites ao `PredictionEngine`, configurável via `PredictionConfig` e selecionável na UI.

## Responsabilidades

- Especificar algoritmo com statistician
- Implementar strategy em `prediction/strategies/`
- Registrar em enum `PredictionStrategy` (se nova) ou pesos em HYBRID
- Persistir palpites com metadata explicativa
- Atualizar UI e documentação

## Entradas

- Descrição da heurística e motivação estatística
- `GameRules` — deve funcionar para os 3 jogos ou documentar exceção
- Skills: `probabilistic-analysis`, `backtesting-methodology`
- Roles: `statistician`, `backend-architect`

## Saídas

- Arquivo strategy (ex.: `momentum-weighted.ts`)
- Integração em `prediction-engine.ts`
- Entrada em `PREDICTION_STRATEGIES` (constants)
- Opcional: migration enum Prisma
- Teste manual: palpite válido por jogo

## Padrões

**Interface strategy:**

```typescript
type StrategyFn = (
  rules: GameRules,
  draws: DrawRecord[],
  weights?: Record<string, number>
) => number[];
```

**Fluxo:**

1. Documentar fórmula em `docs/analytics/strategies/{name}.md`
2. Implementar função pura
3. Registrar no switch/factory do engine
4. `validateDraw` no resultado final
5. Salvar `metadata: { strategyParams, sampleSize }`

## Checklist

- [ ] Algoritmo documentado sem prometer previsão?
- [ ] Retorna exatamente `rules.pickCount` números?
- [ ] Números únicos no universo válido?
- [ ] Funciona com draws vazio (erro claro)?
- [ ] Funciona com amostra pequena?
- [ ] Enum Prisma + seed se nova strategy?
- [ ] UI lista estratégia com description?
- [ ] Backtest básico documentado (opcional)?

## Pitfalls

- Strategy acessa Prisma diretamente
- Viés de lookahead (usa último draw de forma incorreta)
- Só testada em Lotofácil
- `confidence` calibrado como probabilidade de ganhar
- Esquecer HYBRID weights

## Exemplos práticos

**Registrar estratégia:**

```typescript
// constants.ts — PREDICTION_STRATEGIES
{
  value: PredictionStrategy.MOMENTUM_WEIGHTED,
  label: "Momentum Recente",
  description: "Pondera dezenas com alta frequência na janela dos últimos N concursos",
}
```

**Metadata no palpite:**

```json
{
  "windowSize": 30,
  "sampleDraws": 3450,
  "weights": { "recent": 0.7, "historical": 0.3 }
}
```

**Prompt:**

> Siga `playbooks/add-new-heuristic.md`. Estratégia DELAY_FOCUSED: 70% peso nos 30% mais atrasados. Valide nos 3 jogos. Role: statistician + backend-architect.
