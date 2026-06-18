# UI — Visão geral

## Design principles

- **Clean, premium, data-first** — inspirado em dashboards analíticos SaaS
- **Identidade por jogo** — cor primária de `GAMES[slug].color`
- **Sério** — evitar visual de cassino ou promessa de ganho
- **Responsivo** — mobile-first em tabelas e grids

## Stack UI

| Item | Local |
|------|-------|
| Rotas | `src/app/(dashboard)/`, `src/app/(marketing)/` |
| Design system | `src/components/ui/` |
| Layout | `src/components/layout/` (Sidebar, PageHeader, DisclaimerBanner) |
| Gráficos | `src/components/charts/` (Recharts) |
| Domínio | `src/components/domain/` |

## Cores por jogo

| Jogo | Cor | Gradiente |
|------|-----|-----------|
| Lotofácil | `#7c3aed` | violet → purple |
| Mega-Sena | `#16a34a` | emerald → green |
| Quina | `#2563eb` | blue → sky |

Definidas em `src/modules/shared/constants.ts`.

## Componentes obrigatórios

- `DisclaimerBanner` — palpites e análises
- `PageHeader` — título + descrição
- Estados: skeleton loading, empty (link importação), error

## Padrões Tailwind

- Cards: `Card` + `glass` (se definido no tema)
- Grid KPI: `grid gap-4 md:grid-cols-2 lg:grid-cols-3`
- Texto secundário: `text-muted-foreground`
- Bordas: `border-border`, `rounded-xl`

## Gráficos (Recharts)

- Altura padrão ~300px
- `ResponsiveContainer width="100%" height={300}`
- Tooltip com unidade (% ou concursos)
- Cores: `fill={game.color}`

## Acessibilidade mínima

- Contraste adequado em badges e gráficos
- Labels em formulários (`Label` + `Input`)
- Não depender só de cor para status (usar texto/badge)

## Referências

- Skill: [`dashboard-design.md`](../../skills/dashboard-design.md)
- Role: [`frontend-architect.md`](../../roles/frontend-architect.md)
- Playbook: [`create-new-dashboard.md`](../../playbooks/create-new-dashboard.md)
