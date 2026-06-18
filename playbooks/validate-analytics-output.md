# Playbook: Validate Analytics Output

## Objetivo

**QA sistemático** das saídas analíticas e palpites: consistência matemática, isolamento por jogo, integridade de dados e conformidade de produto (disclaimer).

## Responsabilidades

- Executar checklist abaixo após mudanças em analytics/prediction/ETL
- Comparar amostras com cálculo manual ou SQL
- Bloquear merge se P0
- Documentar bugs com passos reproduzíveis

## Entradas

- Feature ou PR em revisão
- Banco com sync parcial (≥ 50 concursos por jogo ideal)
- Skills: `probabilistic-analysis`, `lottery-domain-rules`
- Role: `qa-engineer`, `statistician`

## Saídas

- Checklist preenchido (pass/fail por item)
- Lista de issues priorizados
- Aprovação ou pedido de correção

## Padrões

**Amostragem:**

- 1 concurso conhecido — dezenas batem com site Caixa
- 1 número específico — contar aparições manualmente em 100 concursos
- 1 palpite — length, range, unicidade

**Tolerância numérica:**

- Percentuais: ±0.1% vs referência
- Contagens: exatas

## Checklist

### Integridade de dados
- [ ] `totalDraws` = count no banco para filtro equivalente
- [ ] `lastContest` = MAX(contestNumber)
- [ ] Cada draw: `numbers.length` = `rules.drawCount`
- [ ] Sem número fora de `[minNumber, maxNumber]`

### Métricas
- [ ] Soma de frequências coerente com `totalDraws × drawCount`
- [ ] `expected` ≈ `totalDraws * drawCount / universeSize`
- [ ] `delay` = 0 para números do último concurso filtrado
- [ ] Hot/cold ≈ 20% do universo (arredondamento ok)
- [ ] Paridade: even + odd = drawCount × totalDraws (soma de pares por draw)

### Isolamento
- [ ] API lotofacil não retorna dados megasena
- [ ] `gameType` correto em snapshots/indicators

### Palpites
- [ ] `validateDraw` passa
- [ ] `strategy` e `metadata` preenchidos
- [ ] `confidence` entre 0 e 1 (se presente)
- [ ] Disclaimer na UI

### Regressão
- [ ] `npm run build` / `lint`
- [ ] Re-sync não duplica concursos

## Pitfalls

- Validar só com banco vazio — falsos positivos em empty state
- Confiar em cache `isCurrent` sem invalidar após sync
- Ignorar filtros — bug só aparece com `fromContest`
- Aceitar off-by-one em atraso

## Exemplos práticos

**SQL frequência manual (Lotofácil #7):**

```sql
SELECT COUNT(*) FROM lotofacil_draws
WHERE 7 = ANY(numbers)
  AND contest_number BETWEEN 3400 AND 3450;
```

Compare com `frequency` do analytics no mesmo filtro.

**Teste de palpite:**

```http
POST /api/quina/predictions
{ "strategy": "HYBRID" }
```

Verificar: 5 números, 1–80, distintos.

**Relatório de bug:**

```
P1 — Mega-Sena delay incorreto
Repro: filtro fromContest=3000, número 60 mostra delay 0 mas não saiu no último
Esperado: delay >= 1
Arquivo: analytics-engine.ts computeDelays()
```
