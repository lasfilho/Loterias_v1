# ETL — Coleta e ingestão de concursos

Pipeline **Extract → Validate → Transform → Load** para Lotofácil, Mega-Sena e Quina.

## Pré-requisitos

```bash
docker compose up -d
cp .env.example .env
npm install
npm run db:push
npm run db:seed
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run etl:load` | Carga histórica **completa** (todos os jogos, modo `full`) |
| `npm run etl:load:lotofacil` | Carga full só Lotofácil |
| `npm run etl:incremental` | Novos concursos desde o último no banco |
| `npm run etl:sync` | Alias de incremental (todos) |
| `npm run etl:sync:quina` | Incremental por jogo |
| `npm run etl:reprocess -- quina 1 100` | Reprocessa intervalo (atualiza existentes) |

### Teste rápido (50 concursos)

```bash
npm run etl:load:lotofacil -- 50
npm run etl:incremental -- lotofacil 50
```

## Arquitetura

```
scripts/etl/*.ts          → CLI
        ↓
ingestion-registry        → serviço por modalidade
        ↓
EtlPipeline               → extract → validate → transform → load
        ↓
DrawSourceAdapter         → Caixa API (intercambiável)
        ↓
GameRepository            → upsert Prisma + import_batch
```

### Código-fonte

| Camada | Pasta |
|--------|-------|
| Adapters | `src/modules/shared/etl/adapters/` |
| Mappers | `src/modules/shared/etl/mappers/` |
| Validators | `src/modules/shared/etl/validators/` |
| Pipeline | `src/modules/shared/etl/pipeline/etl-pipeline.ts` |
| Serviços | `src/modules/{jogo}/ingestion.service.ts` |

## Modos de ingestão

| Modo | Comportamento |
|------|----------------|
| `full` | Concursos 1 → último oficial; **pula** existentes; preenche lacunas |
| `incremental` | Último local + 1 → último oficial |
| `reprocess` | Intervalo definido; **força** upsert (atualiza metadata) |

## Logs

Cada execução cria registro em `import_batches`:

- `contestsAdded`, `contestsUpdated`, `contestsSkipped`, `contestsFailed`
- `status`: SUCCESS | PARTIAL | FAILED
- `metadata.errors`: até 100 erros por concurso
- Draws gravam `importBatchId`, `dataSourceId`, `rawPayload`

Consultar: `npm run db:studio` ou UI `/importacao`.

## API HTTP

```http
POST /api/sync
{ "game": "megasena", "maxContests": 100 }
```

Usa o mesmo pipeline (`syncGame` → `runIncremental`).

## Tratamento de erros

- Retry HTTP (3x) na API Caixa
- Concurso inválido: registrado em `metadata.errors`, batch pode ficar `PARTIAL`
- 404 na API: concurso ignorado (`skipped`)
- Falha fatal: batch `FAILED`, exceção propagada

## Nova fonte de dados

1. Implementar `DrawSourceAdapter` (ver `csv-file.adapter.ts` stub)
2. Injetar no serviço de ingestão do jogo
3. Registrar `DataSource` no seed

## Reprocessar após correção de mapper

```bash
npm run etl:reprocess -- lotofacil 3400 3450
```
