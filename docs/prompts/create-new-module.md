# Prompt: Criar módulo novo (nova loteria)

## Quando usar

Adicionar uma modalidade que ainda não existe no sistema (ex.: Lotomania, Timemania).

## Prompt

```
Contexto: Projeto Loteria Analytics (Next.js 15 + Prisma + PostgreSQL).
Arquitetura modular com um domínio por jogo em src/modules/{slug}/.
Jogos atuais: Lotofácil, Mega-Sena, Quina.

Tarefa: Adicionar o jogo {NOME} com as regras oficiais:
- Universo: {MIN} a {MAX}
- Dezenas sorteadas por concurso: {DRAW_COUNT}
- apiSlug Caixa: {API_SLUG}
- Cor primária UI: {HEX_COLOR}

Siga obrigatoriamente:
- @playbooks/build-new-lottery-module.md
- @roles/backend-architect.md
- @skills/prisma-schema-design.md
- @skills/lottery-domain-rules.md

Entregáveis:
1. Models Prisma {Game}Draw e {Game}Prediction
2. src/modules/{slug}/repository.ts + registro em factories
3. Entrada em GAMES (constants.ts)
4. Rotas app/(dashboard)/{slug}/page.tsx (mínimo)
5. API GET /api/{slug}/analytics (espelhar lotofacil)
6. Script npm run etl:sync:{slug}
7. npm run db:push && db:generate && build

Restrições:
- NÃO alterar lógica específica dos jogos existentes
- NÃO usar tabela genérica de concursos
- NÃO prometer previsão no copy
- validateDraw em todo dado ingerido

Aceite:
- Sync de 5 concursos de teste sem erro
- validateDraw passa em amostra real da API
- Build passa
```

## Variáveis

| Placeholder | Exemplo |
|-------------|---------|
| `{NOME}` | Timemania |
| `{MIN}` / `{MAX}` | 1 / 80 |
| `{DRAW_COUNT}` | 10 |
| `{API_SLUG}` | timemania |
| `{HEX_COLOR}` | #f59e0b |

## Pós-execução

1. `npm run db:seed` se novos enums
2. Sync parcial antes do histórico completo
3. Atualizar `docs/product/overview.md` se escopo v1 mudar
