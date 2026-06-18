# Skill: Backtesting Methodology

## Objetivo

Definir metodologia de **backtesting retrospectivo** para avaliar estratégias de palpite e métricas analíticas, evitando lookahead bias e overfitting, com resultados documentados e reproduzíveis.

## Responsabilidades

- Propor protocolo de teste temporal walk-forward
- Definir métricas de avaliação (acertos parciais, hit rate por faixa)
- Implementar scripts de backtest (fase 2) em `scripts/backtest/`
- Interpretar resultados com `statistician.md`
- Não usar backtest para prometer retorno financeiro

## Entradas

- Histórico completo `{jogo}_draws`
- Estratégia `PredictionStrategy` e pesos
- Janela mínima de treino (ex.: 100 concursos)
- Regras oficiais de premiação por acertos (documentação)

## Saídas

- Relatório: acertos médios por concurso testado
- Distribuição de hits (0 a drawCount acertos)
- Comparação entre estratégias A vs B
- Recomendação de ajuste de pesos (com cautela)

## Padrões

**Walk-forward:**

```
Para t = T_min .. T_max:
  treino = draws[concurso < t]
  palpite = generate(treino, strategy)
  real = draw[t]
  hits = |palpite ∩ real|
```

**Métricas:**

- `mean_hits` = média de acertos por concurso
- `hit_rate_k` = % concursos com ≥ k acertos
- Comparar com baseline aleatório (simulação Monte Carlo)

**Baseline aleatório:**

- Gerar N palpites uniformes; mesma métrica
- Estratégia só "vence" se superar baseline de forma consistente

**Integridade:**

- Sem usar draw[t] no treino
- Sem otimizar pesos no mesmo período de teste
- Separar holdout final (últimos 10% concursos)

## Checklist

- [ ] Treino sempre estritamente anterior ao teste?
- [ ] Baseline aleatório incluído?
- [ ] Amostra mínima documentada?
- [ ] Resultados por jogo separados?
- [ ] Conclusões evitam linguagem de lucro garantido?
- [ ] Parâmetros da estratégia fixos antes do teste?

## Pitfalls

- **Lookahead** — incluir concurso atual no treino
- **Múltiplos testes sem correção** — p-hacking em estratégias
- **Otimizar no holdout** — invalida teste
- **Ignorar custo da aposta** — análise financeira é escopo separado
- **Lotofácil vs Mega-Sena** — hit rates não comparáveis diretamente

## Exemplos práticos

**Mega-Sena — 6 acertos impossível frequentemente:**

- Avaliar `mean_hits` e % com ≥ 4 acertos
- Baseline: C(6,k) hipergeométrico teórico

**Script conceitual:**

```typescript
for (let t = 100; t <= maxContest; t++) {
  const train = await repo.findMany({ toContest: t - 1 });
  const pred = engine.generate(rules, train, strategy);
  const actual = await repo.findMany({ fromContest: t, toContest: t });
  const hits = intersection(pred.numbers, actual[0].numbers).length;
  results.push(hits);
}
```

**Leitura honesta:**

> "Na janela 2010–2024, HYBRID teve média 2.1 acertos vs 2.0 do aleatório — diferença pequena, dentro do ruído esperado."
