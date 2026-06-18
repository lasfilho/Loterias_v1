# Skill: Dashboard Design

## Objetivo

Padronizar criação de **dashboards analíticos** por modalidade: layout, hierarquia visual, gráficos Recharts e estados de interface alinhados ao design premium do produto.

## Responsabilidades

- Estruturar páginas em `src/app/(dashboard)/{jogo}/`
- Reutilizar `components/charts/*` e `components/layout/*`
- Mapear `AnalyticsSummary` → visualizações
- Aplicar cores e gradientes de `GAMES[slug]`
- Garantir responsividade e acessibilidade básica

## Entradas

- `AnalyticsSummary` de `shared/types.ts`
- KPIs definidos por `data-analyst.md`
- `docs/ui/overview.md`
- Role: `frontend-architect.md`, `product-designer.md`

## Saídas

- Página dashboard funcional
- Gráficos com tooltip, eixos e unidades corretas
- Cards de KPI (último concurso, total, hot numbers)
- Estados: skeleton, empty, error
- Playbook seguido: `create-new-dashboard.md`

## Padrões

- **Layout**: `PageHeader` + `DisclaimerBanner` + grid de cards + charts
- **Grid**: `grid gap-4 md:grid-cols-2 lg:grid-cols-3` para KPIs
- **Gráficos**: altura fixa ~300px; `ResponsiveContainer` (Recharts)
- **Cores**: primária = `game.color`; neutros do tema Tailwind
- **Números sorteados**: componente `NumberBall` com dezena formatada
- **Filtros**: barra superior; debounce em sliders de concurso
- **Server-first**: fetch no Server Component; passar props serializáveis

## Checklist

- [ ] Título indica jogo (ex.: "Lotofácil — Visão Geral")?
- [ ] Último concurso visível acima da dobra?
- [ ] Gráficos têm título e descrição curta?
- [ ] Percentuais com 1–2 casas decimais?
- [ ] Empty state linka para `/importacao`?
- [ ] Funciona em mobile (scroll horizontal em tabelas)?

## Pitfalls

- **Muitos gráficos iguais** — variar métricas (freq vs atraso vs paridade)
- **Eixo Y truncado** — distorce percepção de diferença
- **Client bundle enorme** — import dinâmico de charts pesados
- **Sem unidade** — usuário confunde contagem com %
- **Hydration mismatch** — datas formatadas diferente server/client

## Exemplos práticos

**Seção KPI:**

```tsx
<Card>
  <CardHeader><CardTitle>Último concurso</CardTitle></CardHeader>
  <CardContent>
    <p className="text-2xl font-bold">#{summary.lastContest}</p>
    <p className="text-muted-foreground">{formatDate(summary.lastDrawDate)}</p>
  </CardContent>
</Card>
```

**Gráfico de frequência:**

```tsx
<BarChart data={summary.frequency}>
  <XAxis dataKey="number" />
  <YAxis />
  <Tooltip formatter={(v) => `${v}%`} />
  <Bar dataKey="percentage" fill={game.color} />
</BarChart>
```

**Métricas mínimas por dashboard:**

| Bloco | Componente |
|-------|------------|
| Resumo | último sorteio + bolas |
| KPIs | totalDraws, hot/cold count |
| Frequência | BarChart |
| Atraso | BarChart ou tabela top 10 |
