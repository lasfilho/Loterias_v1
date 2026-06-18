# Arquitetura do Frontend — Dashboards

## Visão geral

O frontend segue o App Router do Next.js 15 com dashboards **client-side** que consomem APIs REST, permitindo filtros reativos, skeletons e tratamento de erro sem recarregar a página.

```
src/
├── app/
│   ├── layout.tsx              # ThemeProvider + fontes Geist
│   ├── globals.css             # Design tokens dark/light
│   └── (dashboard)/
│       ├── layout.tsx          # DashboardShell (sidebar)
│       ├── dashboard/page.tsx  # OverviewDashboardView
│       ├── lotofacil/page.tsx
│       ├── megasena/page.tsx
│       └── quina/page.tsx
├── components/
│   ├── dashboard/              # Componentes analíticos
│   ├── charts/                 # Recharts + heatmap CSS
│   ├── layout/                 # Sidebar, tema
│   └── ui/                     # Primitivos (card, tabs, skeleton)
├── hooks/                      # useAnalytics, useDraws, useDashboardFilters
├── lib/api-client.ts           # Fetchers tipados
└── types/dashboard.ts          # Tipos do frontend
```

## Dashboards

| Rota | Componente | Escopo |
|------|------------|--------|
| `/dashboard` | `OverviewDashboardView` | KPIs consolidados + cards por modalidade |
| `/lotofacil` | `GameDashboardView` | Análise completa Lotofácil |
| `/megasena` | `GameDashboardView` | Análise completa Mega-Sena |
| `/quina` | `GameDashboardView` | Análise completa Quina |

Cada dashboard de jogo é **independente**: cor de acento própria (`GAMES[slug].color`), filtros locais e tabs dedicadas.

## Estrutura por dashboard de jogo

1. **Visão geral** — KPIs, último resultado, tendências
2. **Distribuição** — frequência, atraso, par/ímpar, faixas, scatter
3. **Padrões** — pares, trios, heatmap coocorrência, gaps
4. **Histórico** — tabela de concursos
5. **Palpites** — geração e comparação de estratégias
6. **Backtest** — backtest retrospectivo + Monte Carlo

Filtros laterais (`DashboardFiltersPanel`): concurso inicial/final, limite de amostra.

## Componentes principais

| Componente | Função |
|------------|--------|
| `KpiCard` | Métrica com ícone, acento e trend badge |
| `SectionShell` | Título + descrição de seção |
| `DataTable` | Tabela responsiva com hover |
| `DashboardHeader` | Hero do dashboard com grid de fundo |
| `EmptyState` / `ErrorState` | Estados vazios e erro com retry |
| `DashboardSkeleton` | Loading placeholder |
| `MethodologyAccordion` | Metodologia e limitações |
| `TrendBadge` | Indicador up/down/stable |

## Gráficos

| Chart | Tipo | Dados |
|-------|------|-------|
| `FrequencyChart` | Bar | `basic.frequency` |
| `DelayChart` | Bar horizontal | `basic.delays` |
| `TrendLineChart` | Line | repetições consecutivas |
| `MultiTrendChart` | Multi-line | `multiHorizonTrends` |
| `DelayFrequencyScatter` | Scatter | freq × atraso |
| `CooccurrenceHeatmap` | CSS grid | lift de pares |

## APIs consumidas

- `GET /api/dashboard` — stats consolidados
- `GET /api/games/{game}/analytics?fromContest&toContest&limit`
- `GET /api/games/{game}/draws?limit&fromContest&toContest`
- `POST /api/games/{game}/predictions`
- `POST /api/games/{game}/predictions/compare`

## Tema

- `ThemeProvider` persiste preferência em `localStorage`
- Tokens CSS em `:root` (light) e `.dark`
- Toggle na sidebar
- Gráficos usam variáveis CSS (`chart-grid`, `muted-foreground`)

## Responsividade

- Sidebar: drawer no mobile, fixa no desktop
- Grid KPI: 1 → 2 → 4 colunas
- Layout dashboard: conteúdo + filtros empilhados abaixo de `xl`, lado a lado em `xl+`
- Tabelas: scroll horizontal com `scrollbar-thin`
