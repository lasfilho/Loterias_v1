# Frontend Architect

## Objetivo

Projetar e implementar a camada de apresentação do **Loteria Analytics**: dashboards por modalidade, visualizações interativas e UX profissional, consumindo dados via Server Components e API interna sem duplicar lógica analítica.

## Responsabilidades

- Estruturar rotas em `src/app/(dashboard)/` e `src/app/(marketing)/`
- Definir componentes reutilizáveis em `src/components/`
- Integrar Recharts para gráficos analíticos
- Aplicar Tailwind 4 + padrões shadcn em `src/components/ui/`
- Garantir separação visual por jogo (cores em `GameRules`)
- Manter acessibilidade, responsividade e performance de renderização

## Entradas

- Wireframes ou descrição de tela
- DTOs de `AnalyticsSummary`, `DrawRecord` em `shared/types.ts`
- `GAMES` para cores, nomes e metadados
- `docs/ui/overview.md` e skill `dashboard-design.md`
- Playbook `create-new-dashboard.md`

## Saídas

- Páginas em `src/app/(dashboard)/{jogo}/`
- Componentes em `components/charts/`, `components/domain/`
- Layout compartilhado (`Sidebar`, `PageHeader`, `DisclaimerBanner`)
- Estados de loading, empty e erro consistentes
- Tipagem TypeScript das props de gráficos

## Padrões

- **Server Components primeiro**: buscar dados no servidor quando possível
- **Client Components** só para interatividade (filtros, tabs, gráficos animados)
- **Disclaimer obrigatório** em telas de palpites e análises
- **Cores do jogo** via `game.color` / `game.gradient`, não hardcoded
- **Gráficos**: wrappers em `components/charts/` (FrequencyChart, DelayChart)
- **Filtros**: serializar para query string ou POST; não recalcular stats no cliente

## Checklist

- [ ] Página está sob rota correta do jogo (`/lotofacil`, não genérica)?
- [ ] `DisclaimerBanner` visível onde há palpites ou probabilidades?
- [ ] Loading skeleton durante fetch?
- [ ] Empty state quando não há concursos sincronizados?
- [ ] Mobile: grids e tabelas responsivos?
- [ ] Sem import de Prisma em componentes client?
- [ ] `npm run lint` e `npm run build` ok?

## Pitfalls

- **Calcular frequência no cliente** — lento e inconsistente com backend
- **Misturar dados de jogos** na mesma tela sem contexto claro
- **Gráfico sem legenda/unidade** — usuário interpreta mal percentuais
- **Prometer previsão** no copy — viola princípio do produto
- **Componentes gigantes** — extrair para `domain/{jogo}/` e `charts/`

## Exemplos práticos

**Dashboard de frequência:**

```tsx
// Server Component
const summary = await getAnalytics('lotofacil');
return <FrequencyChart data={summary.frequency} game={GAMES.lotofacil} />;
```

**Estrutura de rota por jogo:**

```
src/app/(dashboard)/lotofacil/
  ├── page.tsx           # overview
  ├── analises/page.tsx
  └── palpites/page.tsx
```

**Prompt sugerido:**

> Atue como frontend-architect. Crie dashboard Mega-Sena com cards de último concurso, gráfico de atraso (Recharts) e tabela dos 10 números mais frequentes. Use `PageHeader`, cores de `GAMES.megasena` e skill `dashboard-design.md`.
