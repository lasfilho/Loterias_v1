# Prompt: Revisar arquitetura

## Quando usar

Antes de feature grande, após débito técnico, refactor planejado ou dúvida estrutural.

## Prompt

```
Contexto: Loteria Analytics
Documentação: @ARCHITECTURE.md, @docs/architecture/overview.md, @prisma/schema.prisma

Tarefa: Revisar arquitetura do sistema com foco em:
{ESCOPO — ex: "módulo shared", "ETL", "preparação para 4º jogo", "camada de API"}

Atue como @roles/backend-architect.md com input de @roles/statistician.md quando análises estiverem no escopo.

Entregável — relatório estruturado:

1. **Estado atual** (2–3 parágrafos)
2. **Pontos fortes** (bullet list)
3. **Riscos / débitos** (P0/P1/P2)
4. **Violações de princípios** (isolamento por jogo, domínio puro, etc.)
5. **Recomendações** (máx. 5, priorizadas)
6. **Proposta de evolução** (opcional: diagrama mermaid)
7. **O que NÃO mudar** (evitar over-engineering)

Critérios de avaliação:
- Separação Lotofácil / Mega-Sena / Quina
- Testabilidade do AnalyticsEngine e PredictionEngine
- Rastreabilidade import_batches → draws → analysis_runs
- Escalabilidade para nova loteria (playbook build-new-lottery-module)
- Adequação da stack (Next monolith vs split)

Restrições:
- NÃO implementar código nesta sessão (somente revisão)
- NÃO sugerir microserviços sem justificativa forte
- Manter PostgreSQL + Prisma salvo motivo crítico

Se mudança recomendada for pequena:
- Indicar arquivos exatos e ordem de execução
- Referenciar playbook/skill aplicável
```

## Escopos sugeridos

| Escopo | Foco |
|--------|------|
| `shared kernel` | Acoplamento, ifs por jogo, contratos |
| `data layer` | Schema, índices, snapshots |
| `frontend boundaries` | Server vs client, duplicação |
| `new lottery readiness` | Registry, factories, rotas |
| `auth phase 2` | NextAuth impacto em rotas |

## Saída esperada

Documento markdown que pode ser salvo em `docs/architecture/review-{data}.md` se o usuário solicitar.

## Follow-up

Após revisão, usar prompts específicos:
- `create-new-module.md`
- `improve-performance.md`
- `add-statistical-analysis.md`
