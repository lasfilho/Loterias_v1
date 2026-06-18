# Fontes de dados — Visão geral

## Fonte primária: API Caixa

| Campo | Valor |
|-------|-------|
| Base URL | `https://servicebus2.caixa.gov.br/portaldeloterias/api` |
| Cliente | `src/modules/shared/etl/caixa-client.ts` |
| Slugs | `lotofacil`, `megasena`, `quina` (em `GameRules.apiSlug`) |

### Endpoints usados

```
GET /{apiSlug}           → último concurso
GET /{apiSlug}/{numero}  → concurso específico
```

### Normalização

| API Caixa | Modelo interno |
|-----------|----------------|
| `numero` | `contestNumber` |
| `dataApuracao` | `drawDate` (parse BR) |
| `listaDezenas` | `numbers: int[]` sorted |
| `acumulado` | `accumulated` |
| `valorArrecadado` | `prizePool` |
| `listaRateioPremio[faixa=1]` | `winnersCount` |

## Registro no banco

Tabela `data_sources`:

| code | type | Uso |
|------|------|-----|
| `CAIXA_API` | CAIXA_API | Sync automático |
| `CSV_IMPORT` | CSV_FILE | Futuro import manual |

Seed: `npm run db:seed`

## Rastreabilidade

Cada sync cria `import_batches`:

- `gameType`, `dataSourceId`, `status`
- `fromContest`, `toContest`, `contestsAdded`, etc.
- Draws podem referenciar `importBatchId` e `dataSourceId`
- `rawPayload` opcional para auditoria

## Boas práticas

- Rate limit ~150ms entre requests
- Retry com backoff em falhas transitórias
- Sync incremental (último local + 1)
- Validar com `validateDraw` antes de persistir

## Scripts ETL

Documentação completa: [`scripts/etl/README.md`](../../scripts/etl/README.md)

| Comando | Modo |
|---------|------|
| `npm run etl:load` | Carga histórica full |
| `npm run etl:incremental` | Novos concursos |
| `npm run etl:reprocess -- quina 1 50` | Reprocessar intervalo |

Pipeline: `extract → validate → transform → load` em `src/modules/shared/etl/`.

## Referências

- Skill: [`historical-ingestion.md`](../../skills/historical-ingestion.md)
- Playbook: [`ingest-historical-data.md`](../../playbooks/ingest-historical-data.md)
- Role: [`data-engineer.md`](../../roles/data-engineer.md)
