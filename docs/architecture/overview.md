# Arquitetura — Visão geral

Documentação complementar a [`ARCHITECTURE.md`](../../ARCHITECTURE.md) na raiz do repositório.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15 App Router, React 19, TypeScript |
| Backend | API Routes, Server Actions, `src/modules/` |
| Banco | PostgreSQL 16, Prisma |
| ETL | `scripts/etl/*.ts` (tsx) |
| UI | Tailwind 4, shadcn-style, Recharts |

## Princípios

1. **Três domínios isolados**: Lotofácil, Mega-Sena, Quina
2. **Shared kernel**: analytics, prediction, ETL client, tipos
3. **ETL fora do request HTTP** para histórico completo
4. **Tabelas Prisma separadas** por jogo para concursos e palpites
5. **Tabelas compartilhadas** para ingestão, análises e config

## Camadas

```
app/ (UI + BFF)
  ↓
modules/shared/services/ (orquestração)
  ↓
modules/{jogo}/ + modules/shared/{analytics,prediction,etl}
  ↓
prisma → PostgreSQL
```

## Banco de dados (resumo)

| Grupo | Tabelas |
|-------|---------|
| Por jogo | `lotofacil_draws`, `megasena_draws`, `quina_draws`, `*_predictions` |
| Ingestão | `data_sources`, `import_batches` |
| Análise | `analysis_runs`, `indicator_snapshots`, `number_indicators` |
| Config | `prediction_configs`, `game_settings`, `app_settings` |

Schema completo: `prisma/schema.prisma`

## Extensão

Nova loteria → playbook [`build-new-lottery-module.md`](../../playbooks/build-new-lottery-module.md)

## Referências para agentes

- Role: [`backend-architect.md`](../../roles/backend-architect.md)
- Skills: [`prisma-schema-design.md`](../../skills/prisma-schema-design.md), [`analytics-pipeline.md`](../../skills/analytics-pipeline.md)
