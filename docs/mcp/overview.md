# MCP — Avaliação e uso no Loteria Analytics

## Vale a pena?

**Sim, de forma seletiva.** Para este projeto, MCP compensa principalmente onde o agente precisa **evidência externa ao código**: dados reais no PostgreSQL e (opcionalmente) o browser renderizando dashboards.

O repositório já cobre bem o conhecimento estático via `/docs`, `/skills`, `/roles` e `/playbooks`. MCP não substitui isso — **complementa** com acesso a runtime (banco, UI, GitHub remoto).

### Resumo executivo

| Prioridade | MCP | Veredicto |
|------------|-----|-----------|
| **Alta** | PostgreSQL | Útil — validar ETL, analytics, integridade |
| **Média** | Playwright | Opcional — QA visual/E2E dos dashboards |
| **Média** | GitHub | Opcional global — PRs/issues (se usar GitHub) |
| **Baixa** | Filesystem | **Não usar** — Cursor já tem leitura/escrita no workspace |
| **Baixa** | Docs/reference externo | **Não usar agora** — docs do projeto + @docs Cursor bastam |
| **Baixa** | API testing dedicado | **Não usar** — `curl`/fetch via terminal é suficiente |
| **Baixa** | Sequential thinking | **Não usar** — redundante com o modelo |
| **Baixa** | Python/data-analysis | **Adiar** — analytics em TypeScript; Python só se ML/scipy |

**Config inicial recomendada:** apenas `postgres`. Adicione `playwright` quando for iterar em UI. `github` no config **global** do desenvolvedor.

---

## MCPs recomendados (detalhe)

### 1. PostgreSQL — **realmente útil**

**Pacote:** `@modelcontextprotocol/server-postgres`

**Por quê:** O app é orientado a dados. Muitas tarefas exigem conferir o que está no banco após sync, análise ou palpite — sem adivinhar pelo código.

**Casos de uso no projeto:**

| Cenário | Exemplo de pergunta ao agente |
|---------|-------------------------------|
| Pós-sync | "Quantos concursos Lotofácil temos? Último `contest_number`?" |
| Integridade | "Algum draw com `numbers` fora de 1–25?" |
| Rastreio | "Últimos 5 `import_batches` e status" |
| Analytics | "`number_indicators` do run `is_latest` batem com frequência manual?" |
| Palpites | "Últimos 10 `lotofacil_predictions` e estratégias usadas" |
| Debug | "Por que dashboard vazio?" → `SELECT COUNT(*) FROM lotofacil_draws` |

**Quando o agente já resolve sem MCP:** leitura de `prisma/schema.prisma`, repositórios e tipos — não precisa de SQL para *entender* o modelo.

---

### 2. Playwright — **opcional, mas valioso para frontend**

**Pacote:** `@playwright/mcp@latest`

**Por quê:** Dashboards Recharts, estados empty/loading e fluxo de importação são difíceis de validar só com código estático.

**Casos de uso:**

| Cenário | Ação |
|---------|------|
| Smoke test | Abrir `http://localhost:3000/lotofacil` após `npm run dev` |
| Importação | Clicar "Sincronizar" em `/importacao` e ver feedback |
| Regressão visual | Confirmar `DisclaimerBanner` em `/palpites` |
| Responsivo | Viewport mobile no dashboard |

**Custo:** mais processos Node, download de browsers na primeira execução, consome parte do limite ~40 tools do Cursor.

**Ativar:** bloco em `.cursor/mcp.json.example` ou `mcp.playwright.json.example`.

---

### 3. GitHub — **opcional global**

**Pacote:** `@modelcontextprotocol/server-github`

**Por quê:** Se o repositório estiver no GitHub, o agente pode ler issues/PRs/checks sem copiar contexto manualmente.

**Casos de uso:**

- Resumir comentários de review em PR
- Listar issues abertas por label
- Ver status de CI

**Onde configurar:** `%USERPROFILE%\.cursor\mcp.json` (Windows) — **não** no repo (token).

**Template:** `.cursor/mcp.github.json.example`

---

## MCPs não recomendados (agora)

### Filesystem

Cursor já expõe leitura, busca, edição e terminal no workspace. MCP filesystem duplica capacidade e aumenta superfície de permissão sem ganho claro.

### Docs/reference (Context7, Firecrawl, etc.)

- Documentação **do produto** já está em `/docs` e `AI-DEVELOPMENT.md`
- Stack (Next, Prisma): use `@docs` do Cursor ou links oficiais pontuais
- API Caixa: documentada em `docs/data-sources/overview.md`

Adicionar MCP de scraping só se a equipe consultar docs externas o tempo todo.

### API testing (MCP dedicado)

Rotas internas (`/api/lotofacil/analytics`, `/api/sync`) são poucas. O agente pode:

```bash
curl -s http://localhost:3000/api/sync
```

Sem servidor MCP extra.

### Sequential thinking / planning

Modelos atuais já planejam em cadeia. MCP de "thinking" adiciona latência e complexidade. Use `skills/prompt-chaining.md` e playbooks.

### Python / data-analysis

- Motor analítico: TypeScript (`AnalyticsEngine`, `PredictionEngine`)
- Backtesting futuro: pode ser script `tsx` no repo

Python MCP só se houver requisito explícito (scipy, pandas, ML). Evita segundo runtime e dependências.

---

## Estrutura de configuração

```
.cursor/
├── README.md                      # Setup rápido
├── mcp.json                       # Ativo: postgres (dev local)
├── mcp.json.example               # Template postgres + playwright
├── mcp.playwright.json.example    # Só playwright
└── mcp.github.json.example        # Só github (copiar p/ global)

docs/mcp/
└── overview.md                    # Este arquivo
```

### Config ativa (mínima)

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:postgres@localhost:5432/loteria_analytics"
      ]
    }
  }
}
```

Alinhada ao `docker-compose.yml` e `.env.example`.

### Habilitar Playwright

Mescle o bloco `playwright` de `mcp.json.example` em `mcp.json` e reinicie MCP no Cursor.

---

## Instruções para a equipe

### Pré-requisitos

- Docker Desktop (PostgreSQL)
- Node.js 18+
- Cursor com MCP habilitado (Settings → Tools & MCP)

### Primeira vez

```bash
docker compose up -d
cp .env.example .env
npm install
npm run db:push
npm run db:seed
cp .cursor/mcp.json.example .cursor/mcp.json   # se necessário
```

No Cursor: ativar servidor **postgres** (luz verde).

### Prompts que aproveitam MCP

**Com postgres ativo:**

```
Após o sync da Lotofácil, use o MCP postgres para:
1. Confirmar COUNT(*) em lotofacil_draws
2. Comparar MAX(contest_number) com a API Caixa
3. Listar último import_batches.status
Siga playbooks/validate-analytics-output.md
```

**Com playwright ativo:**

```
Com npm run dev rodando, use Playwright MCP para abrir /lotofacil,
verificar DisclaimerBanner e se o gráfico de frequência renderiza.
Role: qa-engineer.md
```

### Limites do Cursor

- ~**40 tools** ativas no total (todos MCPs somados)
- Mantenha **2–3 servidores** no máximo: postgres + playwright OU postgres + github global

---

## Segurança

| Risco | Mitigação |
|-------|-----------|
| MCP Postgres em produção | **Nunca.** Apenas banco dev local ou staging isolado |
| Credenciais no git | URL dev `postgres/postgres` ok; produção → `mcp.local.json` (gitignored) |
| Token GitHub no repo | Só em `~/.cursor/mcp.json` global |
| SQL destrutivo | Postgres MCP pode escrever; preferir usuário read-only em ambientes compartilhados |
| Playwright em sites externos | Restringir a `localhost:3000` nos prompts; não automatizar login bancário/Caixa com credenciais |
| `.env` | Já no `.gitignore`; não duplicar secrets em `mcp.json` |

### Usuário read-only (opcional, equipe)

```sql
CREATE USER mcp_reader WITH PASSWORD 'dev_reader';
GRANT CONNECT ON DATABASE loteria_analytics TO mcp_reader;
GRANT USAGE ON SCHEMA public TO mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mcp_reader;
```

Use essa URL no `mcp.local.json` pessoal.

---

## Manutenção

- Ao mudar nome do banco/porta: atualizar `mcp.json.example` e `docker-compose.yml` juntos
- Pin de versão (opcional): `@modelcontextprotocol/server-postgres@x.y.z` nos args
- Novo MCP: documentar aqui antes de adicionar ao `mcp.json` compartilhado

## Referências

- [Cursor MCP — documentação](https://docs.cursor.com/context/mcp)
- Playbook QA: `playbooks/validate-analytics-output.md`
- Dados: `docs/data-sources/overview.md`
