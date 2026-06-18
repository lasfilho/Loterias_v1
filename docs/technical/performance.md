# Performance e escalabilidade

Orientações para manter o **Loteria Analytics** responsivo em desenvolvimento e produção.

---

## ETL e banco de dados

| Cenário | Recomendação |
|---------|--------------|
| Primeira carga | Rodar por jogo (`etl:load:lotofacil`) ou com limite (`-- 200`) |
| Produção | `etl:incremental` diário após concurso |
| Reprocess | Apenas intervalos necessários |
| Índices | `contestNumber`, `drawDate`, `importBatchId` já no schema |

**Gargalo típico:** rate limit / latência da API Caixa — pipeline faz upsert idempotente e registra falhas por concurso.

---

## Motor analítico

| Operação | Custo | Mitigação |
|----------|-------|-----------|
| Frequência/atraso | O(n × m) draws × universo | Filtro `limit` ou intervalo de concursos |
| Pares/trios | O(n × k²) | Top N truncado no código |
| Coocorrência / lift | O(pares) | Heatmaps usam subset |
| Monte Carlo | 5000 simulações fixas | Não expor recálculo em loop na UI |

**API:** `GET /api/games/{game}/analytics?limit=500&fromContest=&toContest=`

**Persistência:** `analytics:run` grava snapshots — dashboards podem ler `number_indicators` no futuro sem recalcular tudo.

---

## Geração de palpites

| Fator | Impacto |
|-------|---------|
| Regeneração heurística | Até 12 tentativas se combinação inválida |
| Batch | `batchSize` × tentativas de diversidade |
| Analytics por palpite | Um `compute()` completo por geração |

**Mitigação:** usar `seed` para reprodutibilidade; limitar `batchSize` na UI (ex.: 3–5).

---

## Backtest

| Fator | Impacto |
|-------|---------|
| Walk-forward | `windowSize` × `estratégias` × `PredictionGenerator` completo |
| Treino mínimo | `trainMinDraws` default 80 — exige histórico longo |

**Desenvolvimento:**
```bash
npm run backtest:run -- lotofacil --window 20 --train-min 50
```

**Produção:** `windowSize` 50–100; `persistDetails: false` salva só agregados.

---

## Frontend

| Prática | Detalhe |
|---------|---------|
| Client fetch | Dashboards usam hooks com filtros — debounce em filtros manuais |
| Skeletons | Evita layout shift durante loading |
| Gráficos Recharts | Limitar pontos em line charts (slice nos últimos N concursos) |
| Bundle | Dashboards de jogo ~277 kB First Load — lazy load futuro se necessário |

---

## Build e deploy

| Item | Nota |
|------|------|
| `next build` | Páginas estáticas onde possível; APIs dinâmicas |
| DB offline no build | OK — erros Prisma só em SSG se página acessar DB no build |
| `DATABASE_URL` | Obrigatória em runtime |

---

## Monitoramento sugerido (futuro)

- Duração de `import_batches`  
- Tempo de `analysis_runs`  
- Tempo de `backtest_runs`  
- p95 de `/api/games/*/analytics`  

---

## Checklist rápido

- [ ] Usar filtros de concurso em análises exploratórias  
- [ ] Incremental ETL em vez de full reload  
- [ ] Backtest com janela adequada ao tamanho da base  
- [ ] Não rodar `etl:load` sem limite em CI  
- [ ] `db:push` após mudanças de schema antes de persistir backtests  
