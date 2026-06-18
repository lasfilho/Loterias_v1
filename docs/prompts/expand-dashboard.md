# Prompt: Expandir dashboard

## Quando usar

Nova página, novos gráficos, KPIs ou filtros em dashboard existente de um jogo.

## Prompt

```
Contexto: Loteria Analytics — dashboards por modalidade em src/app/(dashboard)/{JOGO}/.
Dados via getAnalytics(slug) ou API /api/{JOGO}/analytics.
Design: @docs/ui/overview.md

Tarefa: {DESCRIÇÃO DA EXPANSÃO}

Exemplos de expansão:
- Nova página /{JOGO}/analises com gráfico de paridade
- Filtro por intervalo de concursos na UI
- Card de "maiores atrasos" no dashboard principal
- Heatmap de coocorrência (se dados disponíveis)

Jogo alvo: {JOGO}

Siga:
- @playbooks/create-new-dashboard.md
- @skills/dashboard-design.md
- @roles/frontend-architect.md

Se faltar dado no backend:
- Estender AnalyticsSummary ou endpoint PRIMEIRO (etapa separada)
- @roles/backend-architect.md

Restrições:
- NÃO calcular estatísticas no cliente
- Usar cores de GAMES[{JOGO}]
- DisclaimerBanner em telas analíticas/palpites
- Empty state → link /importacao

Aceite:
- Funciona com banco vazio (empty state) e com dados
- Responsivo mobile
- npm run build passa
- Gráficos com título, eixo e unidade
```

## Cadeia (feature média)

**Etapa 1 — Backend (se necessário):**
> Adicionar campo `cooccurrence` em AnalyticsSummary e compute no AnalyticsEngine para {JOGO}. Playbook validate-analytics-output.

**Etapa 2 — Frontend:**
> Usar este prompt com `{DESCRIÇÃO}` = heatmap de coocorrência.

## Variáveis

| Placeholder | Exemplo |
|-------------|---------|
| `{JOGO}` | megasena |
| `{DESCRIÇÃO}` | Adicionar gráfico de barras de atraso top 15 dezenas |
