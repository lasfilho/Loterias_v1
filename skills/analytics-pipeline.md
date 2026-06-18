# Skill: Analytics Pipeline

## Objetivo

Definir e implementar o **pipeline analítico** que transforma `DrawRecord[]` em `AnalyticsSummary`, persiste snapshots em `AnalysisRun` / `IndicatorSnapshot` / `NumberIndicator` e alimenta dashboards sem recálculo a cada request.

## Responsabilidades

- Orquestrar `AnalyticsEngine` em `shared/analytics/`
- Criar/atualizar `AnalysisRun` após sync ou sob demanda
- Popular `indicator_snapshots` e `number_indicators`
- Invalidar análises antigas (`isLatest`, `isCurrent`)
- Expor `getAnalytics(slug, filter)` no `game-service`

## Entradas

- Draws do repositório do jogo
- `GameRules` de `constants.ts`
- Filtros `DrawFilter` (concurso, data, limit)
- Schema: `AnalysisRun`, `IndicatorSnapshot`, `NumberIndicator`

## Saídas

- `AnalyticsSummary` tipado
- Registros persistidos de snapshot (opcional, para cache)
- `analysisRunId` para vincular palpites
- Logs de execução e erros

## Padrões

- **Pipeline**: fetch draws → filter → `AnalyticsEngine.compute()` → persist snapshots
- **Versionamento**: novo run marca anterior `isLatest: false`
- **filterHash**: hash estável do `filterConfig` para cache
- **Snapshot types**: SUMMARY, FREQUENCY, DELAY, PAIRS, PARITY, RANGES, TRENDS
- **NumberIndicator**: uma linha por dezena por run — queries O(1) para top N
- **Puro**: motor sem side effects; persistência no serviço de aplicação

## Checklist

- [ ] `draws` ordenados por `contestNumber` DESC antes do motor?
- [ ] `totalDraws` reflete filtro aplicado?
- [ ] Frequência esperada usa fórmula correta por jogo?
- [ ] Snapshots marcados `isCurrent` apenas para run latest?
- [ ] Falha no meio marca `AnalysisRun` como FAILED?
- [ ] API lê snapshot se existir; senão computa on-the-fly?

## Pitfalls

- **Recalcular tudo a cada page view** — lento com histórico completo
- **Não invalidar cache após sync** — dados desatualizados
- **filterHash colide** — incluir todos os campos do filtro
- **Pares em O(n²)** — limitar top pairs, não todas combinações históricas
- **Misturar jogos no mesmo run** — um `AnalysisRun` = um `gameType`

## Exemplos práticos

**Compute em memória:**

```typescript
const draws = await repo.findMany(filter);
const engine = new AnalyticsEngine(rules, draws);
const summary = engine.compute(filter);
```

**Persistir number indicators:**

```typescript
for (const f of summary.frequency) {
  await prisma.numberIndicator.create({
    data: {
      analysisRunId: run.id,
      gameType: rules.gameType,
      number: f.number,
      frequencyCount: f.count,
      frequencyPct: f.percentage,
      deviation: f.deviation,
      delay: delays.find(d => d.number === f.number)?.delay ?? 0,
    },
  });
}
```

**Disparo pós-sync:**

```
ImportBatch SUCCESS → triggerAnalysisRun(gameType) → populate snapshots
```
