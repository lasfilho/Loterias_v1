# Desenvolvimento assistido por IA

Este repositório inclui estrutura de conhecimento para **agentes, assistentes e Cursor** trabalharem de forma consistente.

## Estrutura

```
/skills          → Competências técnicas (como fazer)
/roles           → Papéis especializados (quem faz)
/playbooks       → Fluxos passo a passo (receitas)
/docs            → Documentação persistente do produto e sistema
  /architecture
  /product
  /analytics
  /data-sources
  /ui
  /prompts       → Prompts reutilizáveis copiáveis
```

## Início rápido

1. Leia [`ARCHITECTURE.md`](ARCHITECTURE.md) e [`docs/README.md`](docs/README.md)
2. Escolha um **role** + **skill** + **playbook** para sua tarefa
3. Use ou adapte um prompt em [`docs/prompts/`](docs/prompts/README.md)

## Exemplos

| Tarefa | Recursos |
|--------|----------|
| Sync histórico | `playbooks/ingest-historical-data.md` + `roles/data-engineer.md` |
| Novo gráfico Quina | `docs/prompts/expand-dashboard.md` + `skills/dashboard-design.md` |
| Nova loteria | `docs/prompts/create-new-module.md` + `playbooks/build-new-lottery-module.md` |
| Revisão técnica | `docs/prompts/review-architecture.md` |

## Manutenção

Ao mudar stack, schema ou regras de negócio, atualize o skill/playbook/doc correspondente na mesma PR.

## MCP (Model Context Protocol)

Configuração em [`.cursor/`](.cursor/README.md) — documentação completa em [`docs/mcp/overview.md`](docs/mcp/overview.md).

| MCP | Prioridade | Uso neste projeto |
|-----|------------|-----------------|
| **PostgreSQL** | Alta | Validar sync, integridade, analytics no banco dev |
| **Playwright** | Opcional | Smoke/E2E dos dashboards |
| **GitHub** | Opcional (global) | PRs e issues — token fora do repo |

**Setup:** `docker compose up -d` → ativar `postgres` em Cursor Settings → Tools & MCP.

Prompts prontos: [`docs/mcp/prompts.md`](docs/mcp/prompts.md).

## Cursor Rules (opcional)

Para carregar contexto automaticamente, copie trechos relevantes para `.cursor/rules/` ou referencie `@docs/architecture/overview.md` nos prompts.
