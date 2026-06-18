# Pontos de extensão

Guia para evoluir o **Loteria Analytics** sem quebrar a separação por modalidade.

---

## Nova modalidade (loteria)

1. Adicionar regras em `src/modules/shared/constants.ts` (`GAMES`)  
2. Criar models Prisma `{jogo}_draws` e `{jogo}_predictions`  
3. Implementar `repository.ts`, `ingestion.service.ts`, `analytics.extension.ts`  
4. Implementar `prediction.service.ts`, `backtest.service.ts`  
5. Registrar em `repository/registry.ts`, `ingestion-registry`, `prediction-registry`, `backtest-registry`  
6. Criar página `src/app/(dashboard)/{jogo}/page.tsx`  
7. Adicionar scripts `etl:load:{jogo}`, `etl:sync:{jogo}`  

**Playbook:** [`playbooks/build-new-lottery-module.md`](../../playbooks/build-new-lottery-module.md)

---

## Nova métrica analítica

| Camada | Onde adicionar |
|--------|----------------|
| Básica | `src/modules/shared/analytics/basic/` |
| Intermediária | `src/modules/shared/analytics/intermediate/patterns.ts` |
| Avançada | `src/modules/shared/analytics/advanced/heuristics.ts` |
| Por jogo | `{jogo}/analytics.extension.ts` |

Atualizar `FullAnalyticsReport` em `analytics/types.ts` e consumo nos dashboards.

**Playbook:** [`playbooks/add-new-heuristic.md`](../../playbooks/add-new-heuristic.md)

---

## Nova estratégia de palpite

1. Adicionar em `prediction/types.ts` (`GenerationStrategy`)  
2. Implementar em `prediction/strategies.ts` (`executeStrategy`)  
3. Registrar em `GENERATION_STRATEGIES`  
4. Incluir em `DEFAULT_BACKTEST_STRATEGIES` se aplicável  
5. Mapear `toPrismaStrategy` se necessário  

**Skill:** [`skills/probabilistic-analysis.md`](../../skills/probabilistic-analysis.md)

---

## Novo adapter de dados (ETL)

Implementar interface em `src/modules/shared/etl/adapters/`:

```typescript
// DrawSourceAdapter — extract draws from source
```

Registrar no pipeline e em `ingestion-registry`.

**Exemplos:** `CaixaApiAdapter`, stub `CsvFileAdapter`

---

## Novo dashboard ou seção

1. Componente em `src/components/dashboard/`  
2. Hook em `src/hooks/` se precisar de fetch  
3. Integrar em `game-dashboard-view.tsx` ou nova rota  

**Playbook:** [`playbooks/create-new-dashboard.md`](../../playbooks/create-new-dashboard.md)

---

## Persistência e pipelines

| Extensão | Serviço |
|----------|---------|
| Snapshot analítico | `analytics-pipeline.service.ts` |
| Palpite enriquecido | `saveGeneratedPrediction` em `game-service.ts` |
| Backtest | `backtest-pipeline.service.ts` |

Padrão: criar run → processar → gravar resultados → atualizar status.

---

## API REST

Rotas em `src/app/api/games/[game]/`:

| Rota existente | Extensão natural |
|----------------|------------------|
| `analytics` | Query params, persist flag |
| `predictions` | Novos body fields |
| `backtest` | Novas métricas no report |
| `draws` | Paginação, ordenação |

---

## Autenticação (fase 2)

Pontos de integração:

- `middleware.ts` — proteger `(dashboard)`  
- `triggeredBy` em runs/batches — associar a `userId`  
- Isolamento de `predictions` e `backtest_runs` por usuário  

---

## Automação

| Job | Script |
|-----|--------|
| Sync diário | `etl:incremental` |
| Analytics pós-sync | `analytics:run all` |
| Backtest semanal | `backtest:run` com `--save` |

Implementar via cron, GitHub Actions ou worker BullMQ.

---

## IA e desenvolvimento

| Recurso | Uso |
|---------|-----|
| `roles/` | Personas (arquiteto, estatístico, frontend) |
| `skills/` | Procedimentos (ETL, Prisma, dashboards) |
| `playbooks/` | Fluxos passo a passo |
| `docs/prompts/` | Prompts reutilizáveis |
| `.cursor/mcp.json` | MCP Postgres para consultas dev |

---

## Testes (futuro)

| Área | Sugestão |
|------|----------|
| ETL | Fixtures JSON da API Caixa + validator |
| Analytics | Snapshots de `FullAnalyticsReport` com draws fixos |
| Prediction | Seed fixo → números determinísticos |
| Backtest | Mini histórico sintético → ranking esperado |

---

## Referências

- [`ARCHITECTURE.md`](../../ARCHITECTURE.md)  
- [`AI-DEVELOPMENT.md`](../../AI-DEVELOPMENT.md)  
- [`docs/README.md`](../README.md)
