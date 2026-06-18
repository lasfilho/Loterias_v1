# Geração de Palpites

Motor de sugestões de jogos para **Lotofácil**, **Mega-Sena** e **Quina**, baseado no motor analítico v2 — não em sorteio aleatório puro.

## Arquitetura

```
src/modules/shared/prediction/
├── types.ts              # tipos, modos, estratégias
├── modes.ts              # pesos por modo (conservador/equilibrado/agressivo)
├── strategies.ts         # execução de cada estratégia
├── heuristics.ts         # validação e rejeição de combinações improváveis
├── scoring.ts            # score do bilhete
├── explain.ts            # explicação por dezena
├── utils.ts              # hash, RNG com seed
├── prediction-generator.ts
├── prediction-registry.ts
└── prediction-engine.ts  # wrapper legado

src/modules/{lotofacil,megasena,quina}/
├── prediction.service.ts
└── prediction.rules.ts   # (Lotofácil: balanceamento 5×5)
```

## Estratégias

| Estratégia | Descrição |
|------------|-----------|
| `FREQUENCY_WEIGHTED` | Prioriza dezenas com maior frequência histórica |
| `DELAY_BALANCED` | Prioriza dezenas com maior atraso atual |
| `COMPOSITE_SCORE` | Usa ranking composto do motor analítico |
| `HOT_COLD_MIX` | Mistura dezenas quentes e frias |
| `PATTERN_AWARE` | Equilíbrio par/ímpar e por faixas |
| `HYBRID` | Combina todas as heurísticas com pesos |

`COMPOSITE_SCORE` persiste no banco como `HYBRID` com `metadata.strategyDetail`.

## Modos de geração

| Modo | Comportamento |
|------|---------------|
| `CONSERVATIVE` | Mais peso em frequência e padrões estáveis |
| `BALANCED` | Balanceamento entre heurísticas (padrão) |
| `AGGRESSIVE` | Mais peso em atraso e scores compostos |

## Heurísticas de rejeição

Combinações que violam regras heurísticas são regeneradas (até 12 tentativas):

- Paridade extrema (ex.: todos pares ou ímpares)
- Concentração em uma única faixa do volante
- Sequências longas consecutivas
- Soma fora da faixa histórica típica (por jogo)

## API

### Gerar palpite

`POST /api/games/{game}/predictions`

```json
{
  "strategy": "HYBRID",
  "mode": "BALANCED",
  "count": 15,
  "batchSize": 3,
  "excludeNumbers": [1, 2],
  "includeNumbers": [10],
  "filter": { "limit": 500 },
  "weights": { "frequency": 0.3, "delay": 0.2 },
  "seed": 42,
  "minDiversity": 6,
  "save": true,
  "notes": "teste"
}
```

Resposta (palpite único):

```json
{
  "hash": "lf_abc123...",
  "gameSlug": "lotofacil",
  "numbers": [1, 2, 3, ...],
  "strategy": "HYBRID",
  "strategyDetail": "HYBRID",
  "mode": "BALANCED",
  "parameters": { "pickCount": 15, "weights": {}, ... },
  "score": 0.72,
  "confidence": 0.72,
  "explanation": "Palpite híbrido em modo equilibrado...",
  "explanationDetails": [{ "number": 5, "reasons": ["..."], "compositeScore": 0.8 }],
  "timestamp": "2026-06-18T...",
  "metadata": { "disclaimer": "...", "hotNumbers": [], ... },
  "id": "cuid..."
}
```

Resposta (lote):

```json
{
  "batch": {
    "predictions": [ ... ],
    "diversityScore": 0.65
  },
  "savedId": "cuid..."
}
```

### Comparar estratégias

`POST /api/games/{game}/predictions/compare`

```json
{
  "mode": "BALANCED",
  "filter": { "limit": 300 }
}
```

Retorna um palpite por estratégia para comparação lado a lado.

### Listar histórico

`GET /api/games/{game}/predictions`

## Persistência

Palpites salvos em `{game}_predictions` com:

- `numbers`, `strategy`, `confidence`
- `metadata` (hash, mode, parameters, score, explanation, etc.)
- `analysisRunId`, `configId` (opcional)
- `notes`

## Uso programático

```typescript
import { generatePredictions, comparePredictionStrategies } from "@/modules/shared/services/game-service";

const result = await generatePredictions("lotofacil", {
  strategy: "COMPOSITE_SCORE",
  mode: "CONSERVATIVE",
  persist: true,
});

const comparison = await comparePredictionStrategies("megasena", {
  mode: "AGGRESSIVE",
});
```

## Disclaimer

Palpites são sugestões estatísticas. **Não há garantia de acerto.** Cada resultado inclui `metadata.disclaimer`.
