# Módulo de Backtest

## Objetivo

Avaliar **retrospectivamente** estratégias de geração de palpites via walk-forward: para cada concurso de teste, o palpite usa **apenas** concursos anteriores como treino.

> **Aviso:** backtest mede aderência histórica das heurísticas. **Não prova** capacidade preditiva em sorteios futuros.

## Arquitetura

```
src/modules/shared/backtest/
├── types.ts                  # tipos, faixas por jogo, disclaimer
├── metrics.ts                # acertos, faixas, streaks, correlação
├── backtest-engine.ts        # walk-forward com PredictionGenerator
├── backtest-pipeline.service.ts  # persistência Prisma
└── backtest-registry.ts      # factory por modalidade

src/modules/{lotofacil,megasena,quina}/backtest.service.ts
```

## Métricas

| Métrica | Descrição |
|---------|-----------|
| `meanHits` / `medianHits` / `stdDevHits` | Estatísticas de acertos por concurso |
| `hitRateByLevel` | % por quantidade exata de acertos (0…N) |
| `hitBandRates` | % por faixa de premiação (ex.: Quadra, Quina, Sena) |
| `partialHitRate` | % de concursos com acertos ≥ limiar parcial |
| `partialStreakStats` | Recorrência e sequências de acertos parciais |
| `scoreCorrelation` | Pearson entre score previsto e acertos reais |
| `periodAggregates` | Média de acertos por bloco de concursos |
| `ranking` | Ordenação por média de acertos e correlação |

### Faixas por modalidade

- **Lotofácil:** 0–10, 11, 12, 13, 14, 15
- **Mega-Sena:** 0–3, Quadra (4), Quina (5), Sena (6)
- **Quina:** 0–1, Duque (2), Terno (3), Quadra (4), Quina (5)

### Limiar de acerto parcial

- Lotofácil: ≥ 11 | Mega-Sena: ≥ 4 | Quina: ≥ 3

## Estratégias testadas

`FREQUENCY_WEIGHTED`, `DELAY_BALANCED`, `COMPOSITE_SCORE`, `HOT_COLD_MIX`, `PATTERN_AWARE`, `HYBRID` + baseline `RANDOM`.

## API

### Executar backtest

`POST /api/games/{game}/backtest`

```json
{
  "windowSize": 50,
  "trainMinDraws": 80,
  "fromContest": 2800,
  "toContest": 3000,
  "mode": "BALANCED",
  "persist": true,
  "persistDetails": false
}
```

### Histórico

`GET /api/games/{game}/backtest`

### Detalhe de execução

`GET /api/games/{game}/backtest/{id}`

## CLI

```bash
npm run backtest:run -- lotofacil --window 50 --train-min 80 --save
npm run backtest:run -- megasena --from 2500 --to 2600 --mode AGGRESSIVE
```

## Persistência

| Tabela | Conteúdo |
|--------|----------|
| `backtest_runs` | Execução, parâmetros, status |
| `backtest_strategy_results` | Métricas agregadas por estratégia |
| `backtest_contest_results` | Detalhe por concurso (opcional) |

## UI

- **`/backtest`** — página dedicada com ranking, gráficos e histórico
- **Dashboard por jogo** — aba Backtest com execução rápida + link para página completa

## Limitações documentadas

Ver `BACKTEST_LIMITATIONS` em `types.ts` e accordion de metodologia na UI.
