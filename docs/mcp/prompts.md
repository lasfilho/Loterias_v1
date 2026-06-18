# Prompts que usam MCP

Copie e adapte no Cursor Composer (Agent). Ative o MCP indicado em Settings → Tools & MCP.

---

## PostgreSQL — validar sync

```
Contexto: Loteria Analytics, banco PostgreSQL local.
MCP: postgres (obrigatório)

Tarefa: Validar sincronização da {JOGO}.

1. SELECT COUNT(*), MAX(contest_number) FROM {tabela}_draws;
2. Último registro em import_batches WHERE game_type = '{GAME_TYPE}';
3. Amostra: 3 concursos com array_length(numbers, 1) esperado
4. Reportar inconsistências vs regras em skills/lottery-domain-rules.md

Não alterar dados. Somente leitura.
```

Tabelas: `lotofacil_draws`, `megasena_draws`, `quina_draws`

---

## PostgreSQL — auditar analytics materializados

```
MCP: postgres

Compare para game_type LOTOFACIL e analysis_runs.is_latest = true:
- COUNT em number_indicators vs tamanho do universo (25)
- indicator_snapshots com snapshot_type = 'SUMMARY' e is_current = true
- Se vazio, indicar que pipeline analytics-pipeline ainda não rodou

Saída: tabela markdown com achados + próximo passo.
```

---

## PostgreSQL — debug dashboard vazio

```
MCP: postgres

O dashboard /{slug} está vazio na UI.
1. Contar draws da modalidade
2. Ver último import_batches (status, contests_added, error_message)
3. Diagnóstico: sem dados | sync falhou | API ok mas UI quebrada
```

---

## Playwright — smoke dashboard

```
MCP: playwright
Pré-requisito: npm run dev em localhost:3000

Navegue para /lotofacil:
- Título ou header menciona Lotofácil
- Disclaimer visível se houver seção de palpites/análises
- Sem erro 500 na página
Capture screenshot mental / descreva o que vê.
```

---

## Playwright — fluxo importação

```
MCP: playwright
Pré-requisito: app rodando

1. Abrir /importacao
2. Verificar cards dos 3 jogos
3. (Opcional) clicar Sincronizar em Quina com maxContests baixo
4. Verificar se histórico de batches atualiza na tela
```

---

## Combinado — QA pós-feature

```
Roles: qa-engineer.md
Playbook: validate-analytics-output.md
MCP: postgres (+ playwright se mudança de UI)

Após implementar {FEATURE}:
1. npm run build
2. Postgres: queries de integridade do playbook
3. Playwright: smoke na rota afetada
Relatório P0/P1/P2.
```
