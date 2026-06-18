# Prompt: Corrigir bug

## Quando usar

Comportamento incorreto, erro em runtime, regressão após mudança ou falha de build/lint.

## Prompt

```
Contexto: Loteria Analytics — @ARCHITECTURE.md

Bug reportado:
- Comportamento esperado: {ESPERADO}
- Comportamento atual: {ATUAL}
- Jogo/modalidade: {JOGO ou "shared"}
- Onde ocorre: {rota, API, ETL, tela}
- Mensagem de erro (se houver): {ERRO}
- Passos para reproduzir: {PASSOS}

Tarefa: Diagnosticar causa raiz e corrigir com diff mínimo.

Processo obrigatório:
1. Reproduzir o problema (ler código, logs, ou simular)
2. Identificar arquivo(s) causador(es) antes de editar
3. Corrigir sem refatorar código não relacionado
4. Verificar se o bug afeta os 3 jogos quando mudança é em shared/

Referências:
- @roles/qa-engineer.md (regressão)
- @skills/lottery-domain-rules.md (se envolve dezenas/validação)
- @playbooks/validate-analytics-output.md (se envolve analytics)

Restrições:
- Mudança mínima focada no bug
- Não introduzir nova feature
- Manter disclaimer e isolamento por jogo

Aceite:
- Passos de reprodução não falham mais
- npm run build passa
- npm run lint passa (se aplicável)
- Explicar causa raiz em 2–3 frases
```

## Exemplo preenchido

```
Esperado: delay do número 10 na Quina reflete concursos desde última aparição
Atual: sempre mostra 0
Jogo: quina
Onde: GET /api/quina/analytics → delays[]
Erro: nenhum
Passos: sync quina → abrir /quina/analises → ver tabela de atraso
```

## Pitfalls a mencionar no prompt

- Pedir fix sem passos de reprodução
- Aceitar workaround sem entender causa
- Esquecer de testar outros jogos após mudança em `shared/`
