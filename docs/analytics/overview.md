# Analytics — Visão geral (motor v2.0)

## Motor analítico

| Item | Valor |
|------|-------|
| Classe | `src/modules/shared/analytics/analytics-engine.ts` |
| Versão | `2.0.0` |
| Saída | `FullAnalyticsReport` |
| Persistência | `analytics-pipeline.service.ts` |

## Estrutura do relatório

```
FullAnalyticsReport
├── meta          → disclaimer, limitações, filtro, engine version
├── basic         → frequência, atraso, paridade, somas, histograma
├── intermediate  → janelas móveis, pares/trincas, correlação, ciclos
├── advanced      → score composto, Monte Carlo, backtest, explicabilidade
├── gameSpecific  → extensão por modalidade
└── (campos legados no topo para dashboards existentes)
```

## Comandos

```bash
npm run analytics:run          # todos os jogos + persiste
npm run analytics:run lotofacil
```

## Metodologia completa

Ver [`methodology.md`](methodology.md) — fórmulas, limitações e alertas estatísticos.

## Extensões por jogo

| Jogo | Específico |
|------|------------|
| Lotofácil | Linhas/colunas 5×5, moldura/miolo do volante |
| Mega-Sena | Decis, moldura linear (6 dezenas nas bordas) |
| Quina | Octetos, moldura linear |

## Referências

- Skill: [`skills/probabilistic-analysis.md`](../../skills/probabilistic-analysis.md)
- Playbook: [`playbooks/validate-analytics-output.md`](../../playbooks/validate-analytics-output.md)
