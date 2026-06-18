# Regras por modalidade

Regras implementadas em `src/modules/shared/constants.ts` (`GAMES`) e validadas no ETL (`draw.validator.ts`).

---

## Lotofácil

| Atributo | Valor |
|----------|-------|
| Universo | 1 a 25 |
| Dezenas sorteadas | 15 |
| Aposta mínima (palpite) | 15 dezenas |
| Volante | Grade 5×5 |

### Premiação (referência para backtest)

| Faixa | Acertos |
|-------|---------|
| Sem premiação | 0–10 |
| Prêmio | 11, 12, 13, 14, 15 |

### Análises específicas

- Distribuição por **linha** e **coluna** do volante  
- **Moldura vs miolo** (borda 5×5)  
- Validação extra em `lotofacil/prediction.rules.ts` (balanceamento 5×5 informativo)  

### Limiar parcial (backtest)

Acertos parciais relevantes: **≥ 11**

---

## Mega-Sena

| Atributo | Valor |
|----------|-------|
| Universo | 1 a 60 |
| Dezenas sorteadas | 6 |
| Aposta mínima (palpite) | 6 dezenas |

### Premiação (referência para backtest)

| Faixa | Acertos |
|-------|---------|
| Sem premiação | 0–3 |
| Quadra | 4 |
| Quina | 5 |
| Sena | 6 |

### Análises específicas

- Moldura/miolo baseada em extremos do universo 1–60  
- Maior espaço combinatório — pares/trios limitados a top N por performance  

### Limiar parcial (backtest)

Acertos parciais relevantes: **≥ 4** (Quadra ou melhor)

---

## Quina

| Atributo | Valor |
|----------|-------|
| Universo | 1 a 80 |
| Dezenas sorteadas | 5 |
| Aposta mínima (palpite) | 5 dezenas |

### Premiação (referência para backtest)

| Faixa | Acertos |
|-------|---------|
| Sem premiação | 0–1 |
| Duque | 2 |
| Terno | 3 |
| Quadra | 4 |
| Quina | 5 |

### Análises específicas

- Universo amplo (80 dezenas) — atenção a dispersão e cobertura  
- Sorteios frequentes — histórico cresce rapidamente  

### Limiar parcial (backtest)

Acertos parciais relevantes: **≥ 3** (Terno ou melhor)

---

## Validação no ETL

Cada sorteio importado é validado:

- Quantidade correta de dezenas  
- Dezenas dentro do universo  
- Sem duplicatas  
- Número de concurso e data consistentes  

Falhas são registradas em `import_batches.metadata.errors`.

---

## Separação de domínio

| Recurso | Isolamento |
|---------|------------|
| Tabelas | `{jogo}_draws`, `{jogo}_predictions` |
| Repositório | `modules/{jogo}/repository.ts` |
| Ingestão | `modules/{jogo}/ingestion.service.ts` |
| Analytics extension | `modules/{jogo}/analytics.extension.ts` |
| Prediction | `modules/{jogo}/prediction.service.ts` |
| Backtest | `modules/{jogo}/backtest.service.ts` |
| Dashboard | `/lotofacil`, `/megasena`, `/quina` |

**Nunca** misturar dezenas ou métricas entre modalidades.
