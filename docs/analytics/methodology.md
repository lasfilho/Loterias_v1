# Metodologia analítica — Loteria Analytics v2.0

> **Aviso:** Todas as métricas são **descritivas** ou **heurísticas**. Não substituem a probabilidade oficial dos jogos nem garantem acertos futuros.

## Princípios

1. Sorteios modelados como eventos aleatórios independentes (i.i.d. uniforme no universo do jogo).
2. Indicadores descrevem o **passado** da amostra selecionada (filtros de concurso/data).
3. Rankings e scores são **relativos** dentro da amostra — não são P(ganhar).
4. Cada modalidade usa extensões próprias quando o volante exige (ex.: linhas/colunas na Lotofácil).

## Análises básicas

| Métrica | Fórmula / método | Limitação |
|---------|------------------|-----------|
| Frequência absoluta | `count(n)` em todos os sorteios filtrados | Sensível ao tamanho da amostra |
| Frequência relativa | `count(n) / (totalDraws × drawCount) × 100` | Não comparar entre jogos diferentes |
| Atraso atual | Concursos desde última aparição de `n` | Falácia do jogador se interpretado como "deve sair" |
| Maior atraso histórico | Máximo gap entre aparições consecutivas | Requer histórico longo |
| Faixas numéricas | Universo dividido em 5 faixas iguais | Arbitrário mas útil para visualização |
| Par/ímpar | Contagem de dezenas pares vs ímpares | Descritivo por sorteio agregado |
| Soma das dezenas | Σ números por concurso → média, mediana, σ | Distribuição da soma, não dos números isolados |
| Repetição consecutiva | \|sorteio_t ∩ sorteio_{t-1}\| | Esperado > 0 mesmo em processo aleatório |
| Histograma de ocorrência | Dezenas agrupadas por faixas de `count` | Granularidade fixa em 5 buckets |
| Quentes/frios | Top/bottom 20% por frequência | Rótulo relativo, não absoluto |

## Análises intermediárias

| Métrica | Método | Limitação |
|---------|--------|-----------|
| Janelas móveis | Frequência nas últimas 10, 30, 50 extrações | Janela curta = ruído |
| Tendência multi-horizonte | Compara taxa recente vs histórica (±12%) | Limiar heurístico |
| Ciclos | Média de gaps entre aparições; CV para estabilidade | Não prova periodicidade real |
| Moldura/miolo | Lotofácil: borda 5×5; outros: extremos do universo | Definição varia por jogo |
| Linhas/colunas | Lotofácil: grade 5×5 | Exclusivo Lotofácil |
| Pares/trincas | Coocorrência em C(k,2) e C(k,3) por sorteio | Top N apenas (performance) |
| Correlação (lift) | `lift = coocorrência / esperado` | Associação ≠ causalidade |
| Saltos | Diferença entre dezenas ordenadas no mesmo sorteio | Descritivo |
| Sequências | Maior sequência consecutiva por sorteio | Eventos raros amplificados |

## Análises avançadas

| Métrica | Método | Limitação |
|---------|--------|-----------|
| Score composto | 35% freq + 25% atraso + 25% tendência + 15% desvio (normalizados) | Pesos heurísticos |
| Ranking probabilístico | Peso = score / Σscores | **Não** é probabilidade oficial |
| Monte Carlo | 5000 sims: sorteio uniforme vs palpite uniforme | Modelo simplificado |
| Backtest | Walk-forward nos últimos 30 concursos | Amostra pequena; sem otimização de parâmetros |
| Cobertura | % do universo coberto por um conjunto | Depende do conjunto escolhido |
| Diversidade | Dispersão + penalidade de cluster (gap ≤ 2) | Heurística de “volante espalhado” |
| Explicabilidade | Razões textuais por componente do score | Narrativa, não prova |

## Pipeline de persistência

1. `AnalysisRun` — execução versionada (`engineVersion: 2.0.0`)
2. `IndicatorSnapshot` — SUMMARY (relatório completo), FREQUENCY, DELAY, PAIRS, TRENDS
3. `NumberIndicator` — uma linha por dezena para dashboards rápidos

Comando: `npm run analytics:run [jogo|all]`

## API

`GET /api/games/{game}/analytics` — computa em memória (sem persistir por padrão)

Para persistir: `runAnalyticsPipeline()` ou `getAnalytics(slug, filter, { persist: true })`

## Alertas (exibidos em `report.meta.limitations`)

- Padrões passados não preveem o futuro
- Scores são heurísticos
- Janelas curtas amplificam ruído
- Correlação ≠ causalidade
- Monte Carlo usa uniforme simplificada
- Backtest pode overfit se mal usado

## Código

| Módulo | Caminho |
|--------|---------|
| Orquestrador | `analytics-engine.ts` |
| Básico | `analytics/basic/` |
| Intermediário | `analytics/intermediate/patterns.ts` |
| Avançado | `analytics/advanced/heuristics.ts` |
| Por jogo | `{lotofacil,megasena,quina}/analytics.extension.ts` |
| Persistência | `analytics-pipeline.service.ts` |
