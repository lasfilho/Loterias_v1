# Data Engineer

## Objetivo

Projetar e operar pipelines de **ingestão, normalização e persistência** dos resultados oficiais das loterias, com rastreabilidade via `ImportBatch`, `DataSource` e integridade referencial no PostgreSQL.

## Responsabilidades

- Manter scripts ETL em `scripts/etl/`
- Evoluir `CaixaApiClient` e serviços de sync em `game-service.ts`
- Garantir idempotência (`upsert` por `contestNumber`)
- Popular e versionar `import_batches`, `analysis_runs` quando aplicável
- Definir índices, seeds e migrações Prisma
- Documentar fontes em `docs/data-sources/`

## Entradas

- API Caixa (`apiSlug` por jogo em `GameRules`)
- Schema Prisma (`*Draw`, `ImportBatch`, `DataSource`)
- Playbook `ingest-historical-data.md`
- Skills: `historical-ingestion.md`, `prisma-schema-design.md`
- Variáveis: `DATABASE_URL`, docker-compose

## Saídas

- Jobs `etl:sync`, `etl:sync:{jogo}` funcionais
- Registros em `import_batches` com métricas corretas
- Concursos em `{jogo}_draws` com `importBatchId` e `dataSourceId`
- Logs de erro acionáveis
- Documentação de rate limit e retry

## Padrões

- **Sync incremental**: `último concurso local + 1` até o mais recente na API
- **Rate limiting**: pausa entre requests (ex.: 150ms) para não sobrecarregar Caixa
- **Normalização única**: `CaixaApiClient.normalize()` → `NormalizedDraw`
- **Validação antes de persistir**: `validateDraw(rules, numbers)`
- **Batch tracing**: todo draw novo referencia `importBatchId`
- **Seed obrigatório**: `npm run db:seed` cria `CAIXA_API` antes do primeiro sync

## Checklist

- [ ] `DataSource` CAIXA_API existe no banco?
- [ ] `ImportBatch` criado com status RUNNING → SUCCESS/FAILED?
- [ ] Concursos duplicados fazem upsert, não insert duplo?
- [ ] Números ordenados e dentro do universo do jogo?
- [ ] `rawPayload` salvo quando auditoria for necessária?
- [ ] Erros parciais registram `PARTIAL` ou metadata com falhas?
- [ ] Script roda via `tsx` fora do Next.js?

## Pitfalls

- **Sync sem seed** — `game-service` falha sem `CAIXA_API`
- **Ignorar 404** em concursos inexistentes — loop deve continuar
- **Não validar tamanho do array** — Lotofácil exige exatamente 15 dezenas
- **Sync dentro de request HTTP longo** — preferir script CLI ou job background
- **Misturar jogos no mesmo batch** — um `ImportBatch` = um `gameType`

## Exemplos práticos

**Fluxo de sync:**

```bash
docker compose up -d
npm run db:push && npm run db:seed
npm run etl:sync:lotofacil
```

**Campos de rastreio no draw:**

```typescript
await prisma.lotofacilDraw.upsert({
  where: { contestNumber: n },
  create: { ...normalized, importBatchId: batch.id, dataSourceId: source.id },
  update: { ...normalized, importBatchId: batch.id },
});
```

**Prompt sugerido:**

> Atue como data-engineer. Implemente retry com backoff no `CaixaApiClient` e registre `contestsFailed` no `ImportBatch`. Siga `playbooks/ingest-historical-data.md`.
