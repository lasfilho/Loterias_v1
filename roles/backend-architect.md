# Backend Architect

## Objetivo

Definir e evoluir a arquitetura server-side do **Loteria Analytics**: domínio modular por modalidade, APIs, persistência e orquestração de casos de uso, garantindo separação limpa entre Lotofácil, Mega-Sena e Quina.

## Responsabilidades

- Estruturar módulos em `src/modules/{jogo}/` e `src/modules/shared/`
- Definir contratos (`GameRepository`, `GameModule`, serviços de aplicação)
- Projetar API Routes e Server Actions em `src/app/api/`
- Alinhar código ao schema Prisma (`prisma/schema.prisma`)
- Garantir que regras de negócio não vazem para componentes React
- Documentar decisões em `docs/architecture/` e `ARCHITECTURE.md`

## Entradas

- Requisito de feature ou bug report
- Schema Prisma e modelos de domínio existentes
- `src/modules/shared/constants.ts` (`GameRules`, `GAMES`)
- Playbooks relevantes (`build-new-lottery-module.md`)
- Skills: `prisma-schema-design.md`, `analytics-pipeline.md`

## Saídas

- Estrutura de pastas e interfaces TypeScript
- Serviços em `src/modules/shared/services/`
- Endpoints REST documentados com Zod
- Diagramas ou ADRs em `docs/architecture/`
- Plano de migração de banco quando necessário

## Padrões

- **Monólito modular**: um deploy Next.js, fronteiras explícitas entre jogos
- **Domínio puro**: `AnalyticsEngine` e `PredictionEngine` sem Prisma/React
- **BFF**: API Routes delegam a serviços; não contêm lógica analítica
- **Registro de jogos**: `getRepository(slug)`, `getGameRules(slug)` como factories
- **Validação**: Zod na borda; `validateDraw(rules, numbers)` no domínio
- **Erros**: mensagens claras; HTTP 4xx para entrada inválida, 5xx para falha interna

## Checklist

- [ ] A alteração respeita isolamento por `GameSlug`?
- [ ] Não há `if (game === 'lotofacil')` espalhado fora do registry?
- [ ] Repositório usa tabela Prisma correta do jogo?
- [ ] Tipos exportados em `shared/types.ts` quando compartilhados?
- [ ] API valida entrada com Zod antes de chamar domínio?
- [ ] Disclaimer presente em endpoints de palpites?
- [ ] `npm run build` passa após mudanças?

## Pitfalls

- **Tabela única de concursos** com `game_type` — mistura universos numéricos diferentes
- **Lógica analítica em API Route** — difícil de testar e reutilizar no ETL
- **Import circular** entre módulos de jogos — use `shared` como hub
- **Esquecer seed** de `DataSource` ao criar fluxo de `ImportBatch`
- **Prisma no AnalyticsEngine** — quebra testabilidade e separação de camadas

## Exemplos práticos

**Adicionar endpoint de analytics por jogo:**

```
src/app/api/lotofacil/analytics/route.ts
  → getAnalytics('lotofacil', filter)
  → LotofacilRepository.findMany()
  → new AnalyticsEngine(rules, draws).compute()
```

**Novo módulo de jogo:**

```
src/modules/quina/
  ├── index.ts
  ├── repository.ts    # prisma.quinaDraw
  └── (opcional) analytics.ts
```

**Prompt sugerido:**

> Atue como backend-architect. Adicione `GET /api/megasena/draws` com paginação por `contestNumber`, validação Zod e delegação ao `MegasenaRepository`. Siga padrões em `src/modules/lotofacil/repository.ts`.
