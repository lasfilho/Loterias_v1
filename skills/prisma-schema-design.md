# Skill: Prisma Schema Design

## Objetivo

Guiar modelagem e evolução do schema PostgreSQL via Prisma no Loteria Analytics, com separação por modalidade, tabelas compartilhadas onde faz sentido e índices para dashboards rápidos.

## Responsabilidades

- Definir modelos em `prisma/schema.prisma`
- Manter enums alinhados ao domínio (`GameType`, `PredictionStrategy`)
- Criar migrações/`db push` e seeds em `prisma/seed.ts`
- Documentar relacionamentos em `docs/architecture/`
- Evitar anti-patterns (tabela única de concursos genérica)

## Entradas

- Requisitos de entidade (draw, palpite, sync, análise)
- Volume esperado (~3k Lotofácil, crescimento contínuo)
- Queries de dashboard (último concurso, top frequência)
- Role: `data-engineer.md`, `backend-architect.md`

## Saídas

- Models Prisma validados (`npx prisma validate`)
- Seed atualizado se novos enums/tabelas obrigatórios
- Índices em campos de filtro e ordenação
- Notas de migração para código dependente (`syncLog` → `importBatch`)

## Padrões

- **Draws por jogo**: `LotofacilDraw`, `MegasenaDraw`, `QuinaDraw`
- **Palpites por jogo**: `*Prediction` com FK opcional a `PredictionConfig`, `AnalysisRun`
- **Compartilhado**: `DataSource`, `ImportBatch`, `AnalysisRun`, `IndicatorSnapshot`, `NumberIndicator`
- **Arrays**: `numbers Int[]` no PostgreSQL; validação de cardinalidade na app
- **Rastreio**: `importBatchId`, `dataSourceId` nos draws
- **JSON**: `metadata`, `filterConfig`, `rawPayload` para flexibilidade
- **Naming**: `@@map("snake_case")` para tabelas SQL

## Checklist

- [ ] `npx prisma validate` ok?
- [ ] FKs com `onDelete` adequado (Cascade em snapshots)?
- [ ] Índices em `gameType + startedAt`, `contestNumber`, `drawDate`?
- [ ] Enums cobrem todos os estados do fluxo?
- [ ] Seed cria registros obrigatórios (`CAIXA_API`)?
- [ ] Código TypeScript atualizado após rename de models?

## Pitfalls

- **Tabela `draws` genérica** — universos 25/60/80 incompatíveis na mesma constraint
- **Esquecer `@@unique`** em `contestNumber` — duplicatas no sync
- **JSON sem estrutura** — documentar shape esperado em `shared/types.ts`
- **Migration em produção sem plano** — `db push` só em dev
- **SyncLog órfão** — preferir `ImportBatch` com `dataSourceId` obrigatório

## Exemplos práticos

**Adicionar campo auditável:**

```prisma
model LotofacilDraw {
  rawPayload Json?
  importBatchId String?
  importBatch ImportBatch? @relation(fields: [importBatchId], references: [id])
}
```

**Índice para dashboard:**

```prisma
@@index([drawDate(sort: Desc)])
@@index([contestNumber(sort: Desc)])
```

**Consulta via Prisma:**

```typescript
await prisma.numberIndicator.findMany({
  where: { gameType: "LOTOFACIL", analysisRun: { isLatest: true } },
  orderBy: { frequencyCount: "desc" },
  take: 10,
});
```
