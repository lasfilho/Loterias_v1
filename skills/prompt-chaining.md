# Skill: Prompt Chaining

## Objetivo

Orquestrar **tarefas complexas** em sequência de prompts menores para agentes de IA, maximizando consistência e reduzindo diffs incorretos ou escopo creep no Loteria Analytics.

## Responsabilidades

- Dividir features em etapas com entregáveis claros
- Referenciar roles, skills e playbooks por etapa
- Definir handoff entre etapas (o que a próxima precisa)
- Manter prompts em `docs/prompts/`
- Evitar repetir contexto desnecessário

## Entradas

- Feature de alto nível (ex.: "dashboard Quina completo")
- Documentação do projeto (`ARCHITECTURE.md`, `/docs`)
- Restrições do usuário (português, mudanças pequenas)

## Saídas

- Sequência 2–5 prompts ordenados
- Critério de "pronto" por etapa
- Lista de arquivos tocados por etapa
- Prompt final de QA/revisão

## Padrões

**Template de elo:**

```
Etapa N de M: [título]
Contexto: [1–2 frases + arquivos]
Pré-requisito: etapa N-1 concluída ([artefatos])
Tarefa: [ação única]
Restrições: [não fazer X]
Aceite: [checklist]
Próxima etapa: [handoff]
```

**Ordem típica:**

1. Domínio/dados (schema, repo, ETL)
2. Serviço/API
3. UI
4. QA/validação
5. Docs (se necessário)

**Combinação de papéis:**

| Etapa | Role |
|-------|------|
| Schema | data-engineer + prisma skill |
| API | backend-architect |
| Dashboard | frontend-architect + dashboard skill |
| Stats | statistician |
| Review | qa-engineer |

## Checklist

- [ ] Cada prompt tem um único objetivo?
- [ ] Artefatos de saída nomeados explicitamente?
- [ ] Etapa final inclui build/lint?
- [ ] Jogo alvo especificado em cada elo?
- [ ] QA é etapa separada em features grandes?

## Pitfalls

- **Mega-prompt** — agente implementa metade e alucina o resto
- **Sem handoff** — etapa 2 não sabe o que etapa 1 criou
- **Paralelizar dependências** — UI antes da API
- **Pular QA** — regressão em shared
- **Repetir arquitetura inteira** — referenciar `/docs` com @

## Exemplos práticos

**Feature: nova estratégia de palpite**

```
1. [statistician] Especificar algoritmo e pesos → docs/analytics/strategies-new.md
2. [backend] Implementar strategy em prediction/strategies/ → build ok
3. [backend] Expor em API + salvar em prediction_configs
4. [frontend] Opção no formulário de palpites
5. [qa] validate-analytics-output + palpite length
```

**Feature: sync + análise automática**

```
1. [data-engineer] ingest-historical-data playbook
2. [backend] trigger AnalysisRun pós-import
3. [qa] snapshots isCurrent após sync
```

**Invocação no Cursor:**

> Execute etapas 1–2 da cadeia em `docs/prompts/add-statistical-analysis.md`. Pare antes da UI.
