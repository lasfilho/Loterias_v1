# Produto — Visão geral

## Posicionamento

**Loteria Analytics** é um sistema de estudo estatístico e geração **assistida** de palpites para loterias oficiais brasileiras. Não promete previsão nem garantia de acerto.

## Modalidades (v1)

| Jogo | Sorteio | Universo |
|------|---------|----------|
| Lotofácil | 15 dezenas | 1–25 |
| Mega-Sena | 6 dezenas | 1–60 |
| Quina | 5 dezenas | 1–80 |

## Jobs to be done

1. Sincronizar histórico oficial
2. Explorar frequências, atrasos e padrões
3. Gerar palpites com estratégias configuráveis
4. Revisar histórico de palpites gerados
5. Comparar visão geral entre jogos (sem misturar regras)

## Fluxos principais

### Onboarding
```
Landing → Dashboard → Importação → Sync por jogo → Dashboard do jogo
```

### Análise
```
Dashboard jogo → Análises (filtros) → Gráficos + tabelas
```

### Palpite
```
Palpites → Escolher estratégia → Gerar → Salvar histórico
```

## Disclaimer (obrigatório)

Texto canônico em `src/modules/shared/constants.ts` → `DISCLAIMER`.

Exibir em: análises probabilísticas, geração de palpites, tooltips de confidence.

## Fora de escopo (v1)

- Apostas online / integração com lotérica
- Promessa de lucro ou "números certos"
- Misturar dezenas entre modalidades
- Auth obrigatória (fase 2)

## Referências

- Role: [`product-designer.md`](../../roles/product-designer.md)
- UI: [`docs/ui/overview.md`](../ui/overview.md)
