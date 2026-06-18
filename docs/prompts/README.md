# Prompts reutilizáveis

Copie e adapte os prompts abaixo no Cursor ou em outros agentes. Combine com roles em `/roles` e skills em `/skills`.

| Arquivo | Uso |
|---------|-----|
| [`create-new-module.md`](create-new-module.md) | Nova modalidade de loteria |
| [`fix-bug.md`](fix-bug.md) | Correção de bug |
| [`expand-dashboard.md`](expand-dashboard.md) | Novas telas/gráficos |
| [`add-statistical-analysis.md`](add-statistical-analysis.md) | Nova métrica ou análise |
| [`improve-performance.md`](improve-performance.md) | Otimização |
| [`review-architecture.md`](review-architecture.md) | Revisão arquitetural |

## Convenções

- Substitua `{JOGO}` por `lotofacil`, `megasena` ou `quina`
- Referencie arquivos com `@caminho` no Cursor
- Uma tarefa por sessão quando possível
- Exija `npm run build` no critério de aceite

## Cadeias sugeridas

Ver [`skills/prompt-chaining.md`](../../skills/prompt-chaining.md).
