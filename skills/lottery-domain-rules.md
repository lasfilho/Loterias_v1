# Skill: Lottery Domain Rules

## Objetivo

Centralizar e aplicar corretamente as **regras oficiais** de cada modalidade brasileira suportada, garantindo validação consistente em ETL, analytics e geração de palpites.

## Responsabilidades

- Manter `GAMES` e `GameRules` em `constants.ts`
- Implementar `validateDraw(rules, numbers)` em `base-repository.ts`
- Documentar particularidades por jogo em `docs/analytics/`
- Impedir mistura de universos numéricos entre modalidades
- Estender registry ao adicionar nova loteria

## Entradas

- Regras oficiais Caixa (universo, quantidade sorteada)
- Payload normalizado `NormalizedDraw`
- Slug: `lotofacil` | `megasena` | `quina`

## Saídas

- `GameRules` completo por slug
- Validação booleana ou erro descritivo
- Testes mentais/documentados por borda
- Atualização de Prisma enum `GameType` se novo jogo

## Padrões

| Jogo | Universo | Sorteados | Aposta mínima (`pickCount`) |
|------|----------|-----------|----------------------------|
| Lotofácil | 1–25 | 15 | 15 |
| Mega-Sena | 1–60 | 6 | 6 |
| Quina | 1–80 | 5 | 5 |

- **Unicidade**: dezenas sorteadas sem repetição
- **Ordenação**: armazenar `numbers` ordenados ASC
- **API slug**: `apiSlug` alinhado à Caixa (`lotofacil`, `megasena`, `quina`)
- **Isolamento**: repositório e tabela Prisma dedicados
- **DISCLAIMER**: análises não alteram probabilidade oficial uniforme

## Checklist

- [ ] `numbers.length === rules.drawCount`?
- [ ] Todos os números em `[minNumber, maxNumber]`?
- [ ] Sem duplicatas?
- [ ] `pickCount` usado na geração de palpites (pode diferir de drawCount em apostas múltiplas — fase 2)?
- [ ] UI exibe `game.description` corretamente?
- [ ] Novo jogo registrado em `GAME_SLUGS` e `game-registry`?

## Pitfalls

- **Assumir volante único** — apostas com mais números são feature futura
- **Validar só no frontend** — sempre validar no ETL e prediction
- **Comparar frequência entre jogos** — universos incompatíveis
- **Esquecer concurso 0** — concursos começam em 1
- **Mega-Sena sorteio especial** — tratar variações via metadata se surgirem

## Exemplos práticos

**Validação:**

```typescript
export function validateDraw(rules: GameRules, numbers: number[]): boolean {
  if (numbers.length !== rules.drawCount) return false;
  const unique = new Set(numbers);
  if (unique.size !== numbers.length) return false;
  return numbers.every(n => n >= rules.minNumber && n <= rules.maxNumber);
}
```

**Uso no ETL:**

```typescript
const normalized = client.normalize(raw);
if (!validateDraw(rules, normalized.numbers)) {
  batch.contestsSkipped++;
  continue;
}
```

**Extensão Lotofácil (análise específica):**

- Faixas do volante: 1–5, 6–10, 11–15, 16–20, 21–25
- Implementar em `modules/lotofacil/analytics.ts`, não em shared genérico
