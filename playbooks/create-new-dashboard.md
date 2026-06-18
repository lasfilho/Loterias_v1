# Playbook: Create New Dashboard

## Objetivo

Criar uma **nova tela ou seção de dashboard** para uma modalidade específica, conectada aos serviços analíticos existentes e seguindo o design system do projeto.

## Responsabilidades

- Definir KPIs e gráficos com product/data analyst
- Implementar rota e componentes
- Consumir `getAnalytics(slug)` ou API
- Tratar estados vazios e loading
- Validar responsividade

## Entradas

- Jogo alvo (`GameSlug`)
- Métricas de `AnalyticsSummary`
- Skills: `dashboard-design`
- Roles: `frontend-architect`, `product-designer`
- Backend: endpoint existente ou novo

## Saídas

- Página em `src/app/(dashboard)/{jogo}/...`
- Componentes em `components/charts/` se reutilizáveis
- Tipagem props
- Screenshot mental: KPI + 2 gráficos mínimo

## Padrões

**Fluxo de implementação:**

1. Confirmar dados disponíveis no serviço
2. Esboçar seções (wireframe textual)
3. Server Component fetch → props
4. Extrair charts client-only
5. Empty → link `/importacao`
6. `npm run build`

**Rota exemplo:**

```
src/app/(dashboard)/megasena/analises/page.tsx
```

## Checklist

- [ ] Dados vêm do servidor (não calculados no client)?
- [ ] `PageHeader` + `DisclaimerBanner`?
- [ ] Cores de `GAMES[slug]`?
- [ ] Loading UI?
- [ ] Empty state?
- [ ] Erro de API tratado?
- [ ] Gráficos com título e unidade?
- [ ] Lint/build ok?
- [ ] Testado com banco vazio e com dados?

## Pitfalls

- Criar API duplicada quando `getAnalytics` já existe
- Gráfico sem dados — crash em vez de empty
- Importar Recharts em layout raiz
- Esquecer filtro que usuário pediu na spec
- Dashboard comparando dezenas entre jogos

## Exemplos práticos

**Página mínima:**

```tsx
export default async function MegasenaAnalisesPage() {
  const summary = await getAnalytics("megasena");
  if (summary.totalDraws === 0) return <EmptyImportState game="megasena" />;
  return (
    <>
      <PageHeader title="Mega-Sena — Análises" />
      <DisclaimerBanner />
      <div className="grid gap-6 md:grid-cols-2">
        <FrequencyChart data={summary.frequency} color={GAMES.megasena.color} />
        <DelayChart data={summary.delays} color={GAMES.megasena.color} />
      </div>
    </>
  );
}
```

**Novos gráficos reutilizáveis:**

- Criar `components/charts/delay-chart.tsx`
- Usar em megasena, quina, lotofacil

**Prompt encadeado:** ver `docs/prompts/expand-dashboard.md`
