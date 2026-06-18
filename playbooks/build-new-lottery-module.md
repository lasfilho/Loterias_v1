# Playbook: Build New Lottery Module

## Objetivo

Adicionar uma **nova modalidade de loteria** ao sistema (ex.: Lotomania, Timemania) seguindo o padrão plugável, sem alterar módulos existentes de Lotofácil, Mega-Sena ou Quina.

## Responsabilidades

- Estender schema Prisma e enums
- Criar módulo em `src/modules/{slug}/`
- Registrar em `GAMES`, factories e rotas
- Adicionar scripts ETL e seed se necessário
- Documentar regras em `skills/lottery-domain-rules.md`

## Entradas

- Regras oficiais: universo, drawCount, apiSlug Caixa
- Identidade: nome, cores, descrição
- Roles: `backend-architect`, `data-engineer`
- Skills: `prisma-schema-design`, `lottery-domain-rules`

## Saídas

- Modelos `{Game}Draw`, `{Game}Prediction`
- `src/modules/{slug}/repository.ts` + `index.ts`
- Rotas `app/(dashboard)/{slug}/` e `app/api/{slug}/`
- Script `etl:sync:{slug}`
- Entrada em `GAME_SLUGS`

## Padrões

1. Um PR focado por jogo (evitar +3 jogos de uma vez)
2. Copiar estrutura de `quina/` como template (menor universo simples)
3. Tabela Prisma dedicada — nunca tabela genérica
4. Testar sync parcial (`maxContests: 10`) antes do histórico completo

## Checklist

- [ ] `GameType` enum atualizado no Prisma
- [ ] Models draw + prediction criados
- [ ] `GAMES[slug]` com min/max/drawCount/apiSlug corretos
- [ ] `getRepository(slug)` retorna novo repo
- [ ] `validateDraw` passa com sorteio real da API
- [ ] Rotas UI e API espelham outro jogo
- [ ] `npm run etl:sync:{slug}` funciona
- [ ] Dashboard mínimo (`page.tsx`) renderiza
- [ ] `ARCHITECTURE.md` ou `docs/architecture/` atualizado
- [ ] Disclaimer em palpites

## Pitfalls

- Esquecer `db:generate` após schema
- `apiSlug` errado — sync retorna vazio
- Não adicionar em `sync-all.ts`
- Reutilizar cores de jogo existente
- Lógica `if` no AnalyticsEngine — usar só `GameRules`

## Exemplos práticos

**Arquivos a criar (Lotomania fictícia):**

```
prisma/schema.prisma          → LotomaniaDraw, LotomaniaPrediction
src/modules/lotomania/
  repository.ts
  index.ts
src/app/(dashboard)/lotomania/page.tsx
src/app/api/lotomania/analytics/route.ts
scripts/etl/sync-game.ts      → case lotomania
package.json                  → etl:sync:lotomania
```

**Registro:**

```typescript
// constants.ts
lotomania: {
  slug: "lotomania",
  gameType: GameType.LOTOMANIA,
  minNumber: 1,
  maxNumber: 100,
  drawCount: 20,
  pickCount: 20,
  apiSlug: "lotomania",
  ...
}
```

**Prompt:**

> Siga `playbooks/build-new-lottery-module.md` para adicionar Timemania. Use `roles/backend-architect.md` e pare após sync de 5 concursos validado.
