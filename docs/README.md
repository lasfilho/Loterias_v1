# Documentação do projeto

Conhecimento persistente para humanos e agentes de IA.

## Índice principal

O **[README.md](../README.md)** na raiz é o ponto de entrada canônico: visão do produto, setup, operação (ETL, análises, palpites, backtest, dashboards), limitações e próximos passos.

---

## Por área

| Diretório | Conteúdo |
|-----------|----------|
| [`architecture/`](architecture/overview.md) | Camadas, módulos, banco, decisões |
| [`product/`](product/overview.md) | Visão de produto, fluxos, disclaimer |
| [`games/`](games/rules.md) | Regras oficiais por modalidade |
| [`analytics/`](analytics/overview.md) | Motor analítico v2 |
| [`analytics/methodology.md`](analytics/methodology.md) | Metodologia detalhada por métrica |
| [`predictions/`](predictions/generation.md) | Gerador de palpites |
| [`backtest/`](backtest/overview.md) | Backtest walk-forward |
| [`frontend/`](frontend/dashboards.md) | Dashboards e UI |
| [`data-sources/`](data-sources/overview.md) | API Caixa, importação |
| [`technical/decisions.md`](technical/decisions.md) | Decisões arquiteturais |
| [`technical/performance.md`](technical/performance.md) | Performance e escalabilidade |
| [`technical/extensions.md`](technical/extensions.md) | Pontos de extensão |
| [`ui/`](ui/overview.md) | Design system |
| [`mcp/`](mcp/overview.md) | MCPs (Postgres, Playwright) |
| [`prompts/`](prompts/README.md) | Prompts reutilizáveis |

---

## Operação rápida

| Tarefa | Onde |
|--------|------|
| Rodar o projeto | [README § Como rodar](../README.md#como-rodar-o-projeto) |
| Variáveis de ambiente | [README § Env](../README.md#variáveis-de-ambiente) |
| ETL | [`scripts/etl/README.md`](../scripts/etl/README.md) |
| Análises CLI | `npm run analytics:run` |
| Palpites CLI | `npm run predictions:generate` |
| Backtest CLI | `npm run backtest:run` |

---

## Desenvolvimento com IA

| Recurso | Caminho |
|---------|---------|
| Guia geral | [`AI-DEVELOPMENT.md`](../AI-DEVELOPMENT.md) |
| Roles | [`roles/`](../roles/) |
| Skills | [`skills/`](../skills/) |
| Playbooks | [`playbooks/`](../playbooks/) |

---

## Arquitetura de código

Documentação complementar: [`ARCHITECTURE.md`](../ARCHITECTURE.md) na raiz do repositório.

Repositório: [github.com/lasfilho/Loterias_v1](https://github.com/lasfilho/Loterias_v1)
