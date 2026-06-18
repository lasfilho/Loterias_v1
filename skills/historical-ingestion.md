# Skill: Historical Ingestion

## Objetivo

Implementar ingestão **confiável e incremental** de concursos históricos via API Caixa (e futuramente CSV), com normalização, validação e rastreabilidade completa no banco.

## Responsabilidades

- Manter `CaixaApiClient` em `shared/etl/caixa-client.ts`
- Scripts `scripts/etl/sync-game.ts` e `sync-all.ts`
- Integrar `syncGame()` em `game-service.ts`
- Registrar `ImportBatch` e vincular draws
- Respeitar rate limits e idempotência

## Entradas

- `GameRules.apiSlug`
- `DATABASE_URL` + `DataSource` seed `CAIXA_API`
- Parâmetro opcional `maxContests` para sync parcial
- Endpoint Caixa: `https://servicebus2.caixa.gov.br/portaldeloterias/api/{slug}/{numero}`

## Saídas

- Concursos em `{jogo}_draws`
- `ImportBatch` com métricas finais
- Logs stdout/stderr em CLI
- Resposta JSON na API `/api/sync` (POST)

## Padrões

- **Incremental**: `startFrom = latestLocal + 1` ou `1` se vazio
- **Delay**: ~150ms entre requests HTTP
- **404**: concurso inexistente → skip, não falhar batch inteiro
- **Normalize**: `listaDezenas` → `int[]` sorted; `dataApuracao` → `Date`
- **Upsert**: chave `contestNumber`
- **CLI**: `npm run etl:sync:lotofacil` via `tsx`

## Checklist

- [ ] Seed `CAIXA_API` executado?
- [ ] `ImportBatch` RUNNING → SUCCESS/FAILED?
- [ ] `validateDraw` antes de cada upsert?
- [ ] `contestsAdded` reflete apenas novos/atualizados?
- [ ] Re-sync não duplica linhas?
- [ ] Erro de rede marca batch FAILED com mensagem?

## Pitfalls

- **Sync full em produção sem throttle** — bloqueio IP Caixa
- **Parse de data BR** — usar `parseBrazilianDate` em `utils.ts`
- **Zeros à esquerda em dezenas** — `parseInt` na string da API
- **Timeout HTTP** — considerar retry (3x exponential backoff)
- **Sync via UI síncrono longo** — timeout de serverless; preferir CLI

## Exemplos práticos

**Comando:**

```bash
npm run etl:sync:megasena
# ou parcial
tsx scripts/etl/sync-game.ts lotofacil 100
```

**Payload normalizado:**

```json
{
  "contestNumber": 3450,
  "drawDate": "2024-01-15T00:00:00.000Z",
  "numbers": [1, 3, 5, 7, 9, 11, 12, 13, 15, 17, 19, 20, 22, 23, 25],
  "accumulated": false
}
```

**Rastreio:**

```typescript
await repo.upsert({
  ...normalized,
  // repository pode aceitar meta via extensão futura
});
// batch id gravado no service após upsert em lote
```
