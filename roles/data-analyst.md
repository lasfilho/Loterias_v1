# Data Analyst

## Objetivo

Traduzir dados de concursos e indicadores em **métricas acionáveis para produto e dashboards**, definindo KPIs, agregações e narrativas que respeitam o caráter histórico-probabilístico do sistema (sem promessa de acerto).

## Responsabilidades

- Definir métricas em `docs/analytics/`
- Especificar campos de `AnalyticsSummary` e `NumberIndicator`
- Propor filtros úteis (janela de concursos, faixas de data)
- Validar se visualizações respondem perguntas reais do usuário
- Alinhar copy de dashboards com `DISCLAIMER` do produto
- Priorizar métricas para snapshots pré-calculados

## Entradas

- Dados em `{jogo}_draws` e `number_indicators`
- Saída do `AnalyticsEngine` (`shared/types.ts`)
- Regras por jogo (`skills/lottery-domain-rules.md`)
- Feedback de usuário ou hipóteses de análise

## Saídas

- Especificação de métricas (nome, fórmula, interpretação)
- Lista de KPIs por dashboard
- Requisitos para `IndicatorSnapshot.snapshotType`
- Critérios de aceite para `validate-analytics-output.md`
- Sugestões de filtros na UI

## Padrões

- **Métricas interpretáveis**: frequência %, atraso em concursos, desvio vs esperado
- **Contexto sempre**: total de concursos na amostra, último concurso
- **Comparar com baseline**: frequência esperada = `(draws × pickCount) / universe`
- **Evitar causalidade falsa**: "atrasado" ≠ "deve sair"
- **Hot/Cold**: top/bottom 20% do universo, não rótulos absolutos
- **Filtros documentados**: hash em `filterHash` para cache

## Checklist

- [ ] Métrica tem definição matemática clara?
- [ ] Unidade exibida corretamente (% vs contagem vs concursos)?
- [ ] Funciona para os 3 jogos ou está marcada como específica?
- [ ] Copy evita linguagem de garantia?
- [ ] Amostra pequena (< 50 concursos) tem aviso?
- [ ] Métrica agrega valor vs ruído visual?

## Pitfalls

- **Frequência sem normalizar** — universos 25 vs 80 não são comparáveis entre jogos
- **Janela móvel mal definida** — tendência depende do tamanho da janela
- **Pares em Mega-Sena** — combinações C(6,2) por concurso; volume alto
- **Survivorship bias** — filtrar só concursos recentes distorce histórico
- **Overfitting de padrões** — muitos recortes encontram "padrões" por acaso

## Exemplos práticos

**KPIs do dashboard principal por jogo:**

| KPI | Fonte |
|-----|-------|
| Total de concursos | `repository.count()` |
| Último concurso | `getLatestContest()` |
| Top 5 quentes | `number_indicators` ORDER BY frequency |
| Maior atraso | `number_indicators` ORDER BY delay DESC |

**Pergunta → métrica:**

- *"Quais números saem mais?"* → `FrequencyStat` com % e desvio
- *"Há quantos concursos o 13 não sai?"* → `DelayStat.delay`

**Prompt sugerido:**

> Atue como data-analyst. Defina 8 KPIs para o dashboard Quina e especifique quais vão em `IndicatorSnapshot` tipo SUMMARY vs tabela `number_indicators`.
