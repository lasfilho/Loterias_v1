# Prompt: Adicionar análise estatística

## Quando usar

Nova métrica, indicador, extensão do `AnalyticsEngine` ou snapshot type.

## Prompt

```
Contexto: Loteria Analytics
Motor: @src/modules/shared/analytics/analytics-engine.ts
Tipos: @src/modules/shared/types.ts
Regras: @skills/lottery-domain-rules.md

Tarefa: Implementar análise estatística "{NOME_METRICA}":
- Definição: {DEFINIÇÃO_MATEMÁTICA}
- Jogo(s): {JOGO ou "todos via GameRules"}
- Onde exibir: {dashboard / API only / snapshot}
- Filtros suportados: {DrawFilter fields}

Siga:
- @roles/statistician.md (validar fórmula e interpretação)
- @roles/backend-architect.md (implementação)
- @skills/probabilistic-analysis.md
- @skills/analytics-pipeline.md (se persistir em indicator_snapshots)
- @playbooks/validate-analytics-output.md (QA final)

Entregáveis:
1. Campo(s) em AnalyticsSummary ou tipo dedicado
2. Método em AnalyticsEngine (puro, testável)
3. Persistência opcional: NumberIndicator ou IndicatorSnapshot tipo {TIPO}
4. Exposição em getAnalytics / API
5. Documentar fórmula em @docs/analytics/overview.md (seção breve)

Restrições:
- Sem lookahead bias se métrica temporal
- Copy não pode implicar previsão futura
- Funcionar com amostra pequena (≥ 1 concurso) sem crash
- Isolamento: não misturar universos de jogos

Aceite:
- Validação manual em amostra de 3 concursos
- playbook validate-analytics-output checklist passa
- npm run build passa
```

## Exemplo

```
NOME: distribuição por faixas (terços do universo)
DEFINIÇÃO: dividir [minNumber,maxNumber] em 3 faixas iguais; contar dezenas por faixa por sorteio
JOGO: todos via GameRules
Exibir: ranges[] em AnalyticsSummary + gráfico futuro
Filtros: fromContest, toContest
```

## Snapshot type

Se métrica for pesada, adicionar em `SnapshotType` enum no Prisma e gravar em `indicator_snapshots`.
