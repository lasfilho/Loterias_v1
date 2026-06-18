# Prompt: Melhorar performance

## Quando usar

Lentidão em sync, dashboards, cálculo analítico, queries Prisma ou build.

## Prompt

```
Contexto: Loteria Analytics — Next.js 15, Prisma, PostgreSQL.
Problema de performance:
- Área: {ETL / API / dashboard / analytics engine / Prisma query}
- Sintoma: {tempo, timeout, UI travada}
- Jogo: {JOGO ou N/A}
- Volume atual: ~{N} concursos no banco
- Métrica alvo: {ex: API analytics < 500ms p95}

Tarefa: Identificar gargalo e otimizar sem alterar comportamento funcional.

Processo:
1. Medir ou estimar onde está o custo (N+1, full scan, recompute)
2. Propor solução mínima (índice, cache, snapshot, paginação)
3. Implementar
4. Descrever antes/depois

Referências:
- @skills/analytics-pipeline.md (cache AnalysisRun / IndicatorSnapshot)
- @skills/prisma-schema-design.md (índices)
- @docs/architecture/overview.md

Opções preferidas (ordem):
1. Usar number_indicators / indicator_snapshots existentes
2. Adicionar índice Prisma adequado
3. unstable_cache ou cache por filterHash
4. Paginação em listagens de draws
5. Evitar recalcular AnalyticsEngine em cada request

Restrições:
- Não sacrificar isolamento por jogo
- Não cache eterno sem invalidar após import_batches SUCCESS
- Mudança mínima

Aceite:
- Comportamento funcional idêntico (validate-analytics-output)
- Melhoria documentada (1 parágrafo)
- npm run build passa
```

## Cenários comuns

| Sintoma | Direção |
|---------|---------|
| `/api/lotofacil/analytics` lento | Ler `number_indicators` se `isLatest` |
| Sync horas | Já incremental; batch upsert; reduzir delay se seguro |
| Página dashboard TTFB alto | Server Component + snapshot; menos serialização JSON |
| `computePairs` lento | Limitar top 20; pré-computar em snapshot PAIRS |

## Invalidação de cache

Após sync:
```
analysis_runs.isLatest = false
indicator_snapshots.isCurrent = false
→ trigger novo AnalysisRun
```
