# Loteria Analytics

Plataforma profissional de **análise estatística**, **geração assistida de palpites** e **backtest retrospectivo** para as loterias oficiais brasileiras: **Lotofácil**, **Mega-Sena** e **Quina**.

> **Aviso importante:** Este sistema estuda dados históricos e aplica heurísticas. **Não garante acertos**, não altera probabilidades oficiais e **não deve ser usado como promessa de ganho financeiro**.

Repositório: [github.com/lasfilho/Loterias_v1](https://github.com/lasfilho/Loterias_v1)

---

## Índice

- [Visão geral do produto](#visão-geral-do-produto)
- [Objetivo do sistema](#objetivo-do-sistema)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como rodar o projeto](#como-rodar-o-projeto)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Ingestão inicial de dados](#ingestão-inicial-de-dados)
- [Atualização de concursos](#atualização-de-concursos)
- [Análises estatísticas](#análises-estatísticas)
- [Geração de palpites](#geração-de-palpites)
- [Backtests](#backtests)
- [Dashboards](#dashboards)
- [Regras por modalidade](#regras-por-modalidade)
- [Metodologia analítica](#metodologia-analítica)
- [Limitações estatísticas](#limitações-estatísticas)
- [Considerações éticas](#considerações-éticas)
- [Performance](#performance)
- [Decisões técnicas](#decisões-técnicas)
- [Pontos de extensão](#pontos-de-extensão)
- [Scripts disponíveis](#scripts-disponíveis)
- [Documentação adicional](#documentação-adicional)
- [Próximos passos](#próximos-passos)

---

## Visão geral do produto

**Loteria Analytics** é uma plataforma analítica modular que permite:

1. **Importar** o histórico oficial de concursos (API Caixa)
2. **Analisar** padrões descritivos (frequência, atraso, pares, tendências, scores compostos)
3. **Gerar palpites** com estratégias configuráveis e explicação por dezena
4. **Avaliar estratégias** via backtest walk-forward no passado
5. **Visualizar** dashboards premium por modalidade e visão consolidada

Cada modalidade (Lotofácil, Mega-Sena, Quina) possui **domínio isolado**: tabelas, repositórios, serviços e dashboards próprios, com kernel compartilhado para ETL, analytics e predição.

---

## Objetivo do sistema

| Objetivo | Descrição |
|----------|-----------|
| **Estudo estatístico** | Oferecer ferramentas para explorar o histórico de sorteios de forma rigorosa e transparente |
| **Geração assistida** | Sugerir combinações com base em heurísticas (não aleatoriedade pura), com explicação e score |
| **Comparação de estratégias** | Medir aderência histórica via backtest, deixando claro que isso não prevê o futuro |
| **Rastreabilidade** | Registrar importações (`import_batches`), análises (`analysis_runs`) e palpites/backtests |
| **Separação por jogo** | Evitar mistura de regras, universos numéricos ou métricas entre modalidades |

**Não é objetivo:** prometer lucro, substituir julgamento humano, ou afirmar que padrões passados determinam sorteios futuros.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Estilo** | Tailwind CSS 4, Radix UI, Recharts |
| **Backend** | Next.js API Routes, serviços em `src/modules/` |
| **Banco** | PostgreSQL 16 |
| **ORM** | Prisma 6 |
| **ETL / CLI** | `tsx` (TypeScript executável) |
| **Validação** | Zod |
| **Infra local** | Docker Compose (PostgreSQL) |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                          │
│  Landing │ Dashboards │ Análises │ Palpites │ Backtest │ ETL │
└────────────────────────────┬────────────────────────────────┘
                             │ API Routes
┌────────────────────────────▼────────────────────────────────┐
│  Application Services (game-service, pipelines)               │
│  lotofacil │ megasena │ quina │ shared                        │
│  etl │ analytics │ prediction │ backtest │ repository         │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  PostgreSQL — tabelas por jogo + compartilhadas               │
└─────────────────────────────────────────────────────────────┘
```

### Camadas principais

| Camada | Responsabilidade |
|--------|------------------|
| **`src/app/`** | Rotas, páginas, API REST |
| **`src/modules/{jogo}/`** | Repositório, ingestão, analytics extension, prediction, backtest |
| **`src/modules/shared/`** | ETL, motor analítico v2, gerador de palpites, backtest engine, tipos |
| **`scripts/`** | ETL, analytics, predictions, backtest (CLI) |
| **`prisma/`** | Schema e seed |

Detalhes: [`ARCHITECTURE.md`](./ARCHITECTURE.md) e [`docs/architecture/overview.md`](./docs/architecture/overview.md).

---

## Estrutura de pastas

```
Loterias_v1/
├── prisma/
│   ├── schema.prisma          # Modelos: draws, predictions, analysis, backtest, ETL
│   └── seed.ts
├── scripts/
│   ├── etl/                   # Carga inicial, incremental, reprocess
│   ├── analytics/             # Pipeline analítico CLI
│   ├── predictions/           # Geração de palpites CLI
│   └── backtest/                # Backtest CLI
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing
│   │   ├── (dashboard)/       # Área logada/analítica
│   │   │   ├── dashboard/     # Visão consolidada
│   │   │   ├── lotofacil|megasena|quina/
│   │   │   ├── importacao/
│   │   │   ├── analises/
│   │   │   ├── palpites/
│   │   │   ├── backtest/
│   │   │   ├── historico/
│   │   │   └── configuracoes/
│   │   └── api/               # REST BFF
│   ├── components/
│   │   ├── dashboard/         # KPIs, filtros, tabelas, estados
│   │   ├── charts/            # Recharts + heatmaps
│   │   ├── layout/            # Sidebar, tema
│   │   └── ui/                # Primitivos
│   ├── hooks/                 # useAnalytics, useDraws, filtros
│   ├── lib/                   # db, api-client, utils
│   └── modules/
│       ├── lotofacil/
│       ├── megasena/
│       ├── quina/
│       └── shared/
│           ├── etl/
│           ├── analytics/
│           ├── prediction/
│           ├── backtest/
│           ├── repository/
│           └── services/
├── docs/                      # Documentação técnica e de produto
├── roles/ skills/ playbooks/  # Suporte a desenvolvimento com IA
├── ARCHITECTURE.md
└── README.md
```

---

## Como rodar o projeto

### Pré-requisitos

- Node.js 20+
- Docker (para PostgreSQL local) ou instância PostgreSQL acessível
- npm

### Passo a passo

```bash
# 1. Clonar e entrar no projeto
git clone https://github.com/lasfilho/Loterias_v1.git
cd Loterias_v1

# 2. Subir PostgreSQL
docker compose up -d

# 3. Configurar ambiente
cp .env.example .env

# 4. Instalar dependências
npm install

# 5. Criar schema no banco
npm run db:push
npm run db:generate

# 6. (Opcional) Seed de configurações
npm run db:seed

# 7. Carga inicial de concursos (teste com 100 por jogo)
npm run etl:load:lotofacil -- 100
npm run etl:load:megasena -- 100
npm run etl:load:quina -- 100

# 8. Desenvolvimento
npm run dev
```

Acesse **http://localhost:3000**.

### Produção

```bash
npm run build
npm run start
```

---

## Variáveis de ambiente

Arquivo: `.env` (copie de `.env.example`)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string PostgreSQL. Ex.: `postgresql://postgres:postgres@localhost:5432/loteria_analytics?schema=public` |
| `NEXT_PUBLIC_APP_NAME` | Não | Nome exibido na UI. Padrão: `Loteria Analytics` |
| `NEXT_PUBLIC_APP_URL` | Não | URL base da aplicação. Padrão: `http://localhost:3000` |

> **Nunca** commite o arquivo `.env` — ele está no `.gitignore`.

---

## Ingestão inicial de dados

A ingestão segue o pipeline **Extract → Validate → Transform → Load** a partir da API pública da Caixa.

### Carga histórica completa

```bash
# Todos os jogos (pode demorar — milhares de concursos)
npm run etl:load

# Por modalidade
npm run etl:load:lotofacil
npm run etl:load:megasena
npm run etl:load:quina
```

### Carga limitada (desenvolvimento / teste)

```bash
npm run etl:load:lotofacil -- 200
```

### Via interface

1. Acesse **/importacao**
2. Escolha a modalidade
3. Clique em sincronizar

### Via API

```http
POST /api/sync
Content-Type: application/json

{ "game": "lotofacil", "maxContests": 500 }
```

Cada execução gera registro em `import_batches` com contadores de sucesso/falha e rastreio em `importBatchId` nos sorteios.

Documentação: [`scripts/etl/README.md`](./scripts/etl/README.md) · [`docs/data-sources/overview.md`](./docs/data-sources/overview.md)

---

## Atualização de concursos

Para buscar **apenas concursos novos** desde o último gravado no banco:

```bash
# Todos os jogos
npm run etl:incremental
# ou alias
npm run etl:sync

# Por jogo
npm run etl:sync:lotofacil
npm run etl:sync:megasena
npm run etl:sync:quina
```

### Reprocessar intervalo

Útil após correção de mapper ou validação:

```bash
npm run etl:reprocess -- lotofacil 2800 2900
```

---

## Análises estatísticas

O **Motor Analítico v2** (`AnalyticsEngine`) produz relatórios em três camadas:

| Camada | Exemplos |
|--------|----------|
| **Básica** | Frequência, atraso, par/ímpar, faixas, soma, quentes/frios |
| **Intermediária** | Janelas móveis, tendências, pares/trios, coocorrência, gaps |
| **Avançada** | Score composto, ranking heurístico, Monte Carlo, cobertura, diversidade |

### Via API

```http
GET /api/games/lotofacil/analytics?fromContest=2700&toContest=3000&limit=500
```

### Via CLI (com persistência)

```bash
npm run analytics:run lotofacil
npm run analytics:run all
```

Persiste em `analysis_runs`, `indicator_snapshots` e `number_indicators`.

### Via interface

- **/analises** — filtros e gráficos
- **/lotofacil**, **/megasena**, **/quina** — dashboards com abas analíticas

Metodologia detalhada: [`docs/analytics/methodology.md`](./docs/analytics/methodology.md)

---

## Geração de palpites

O **PredictionGenerator** usa o motor analítico + estratégias heurísticas (não sorteio puro).

### Estratégias

| Estratégia | Descrição |
|------------|-----------|
| `FREQUENCY_WEIGHTED` | Prioriza dezenas mais frequentes |
| `DELAY_BALANCED` | Prioriza dezenas com maior atraso |
| `COMPOSITE_SCORE` | Ranking composto do analytics v2 |
| `HOT_COLD_MIX` | Mistura quentes e frias |
| `PATTERN_AWARE` | Equilíbrio par/ímpar e faixas |
| `HYBRID` | Combinação ponderada |

### Modos

- `CONSERVATIVE` — mais peso em frequência e padrões estáveis  
- `BALANCED` — equilíbrio entre heurísticas  
- `AGGRESSIVE` — mais peso em atraso e scores compostos  

### Via API

```http
POST /api/games/lotofacil/predictions
Content-Type: application/json

{
  "strategy": "HYBRID",
  "mode": "BALANCED",
  "save": true,
  "batchSize": 3
}
```

Comparar estratégias: `POST /api/games/{game}/predictions/compare`

### Via CLI

```bash
npm run predictions:generate -- lotofacil --strategy HYBRID --mode BALANCED --save
npm run predictions:generate -- megasena --compare --mode AGGRESSIVE
```

### Via interface

**/palpites** — configurar modalidade, modo, estratégia; gerar, salvar ou comparar.

Documentação: [`docs/predictions/generation.md`](./docs/predictions/generation.md)

---

## Backtests

O módulo de **backtest walk-forward** simula palpites no passado: para cada concurso de teste, usa **somente concursos anteriores** como treino.

> Backtest mede **aderência histórica** — **não prova** capacidade preditiva futura.

### Métricas

- Média/mediana/desvio de acertos  
- Taxa por nível de acerto e por faixa de premiação  
- Recorrência de acertos parciais e sequências  
- Correlação score previsto × acertos reais  
- Ranking de estratégias  

### Via API

```http
POST /api/games/lotofacil/backtest
Content-Type: application/json

{
  "windowSize": 50,
  "trainMinDraws": 80,
  "mode": "BALANCED",
  "persist": true
}
```

Histórico: `GET /api/games/{game}/backtest`

### Via CLI

```bash
npm run backtest:run -- lotofacil --window 50 --train-min 80 --save
```

### Via interface

- **/backtest** — página dedicada com ranking e gráficos  
- Aba **Backtest** nos dashboards por modalidade  

Documentação: [`docs/backtest/overview.md`](./docs/backtest/overview.md)

---

## Dashboards

| Rota | Conteúdo |
|------|----------|
| `/dashboard` | KPIs consolidados, cards por modalidade |
| `/lotofacil` | Dashboard completo Lotofácil (KPIs, tendências, distribuição, padrões, histórico, palpites, backtest) |
| `/megasena` | Dashboard Mega-Sena |
| `/quina` | Dashboard Quina |
| `/analises` | Análises com filtros avançados |
| `/palpites` | Geração de palpites |
| `/backtest` | Avaliação retrospectiva de estratégias |
| `/historico` | Palpites salvos |
| `/importacao` | Sincronização ETL |

Cada dashboard de jogo possui **filtros laterais** (concurso inicial/final, limite de amostra) e **tema claro/escuro**.

Documentação UI: [`docs/frontend/dashboards.md`](./docs/frontend/dashboards.md)

---

## Regras por modalidade

| Modalidade | Universo | Dezenas sorteadas | Aposta mínima (palpite) | Faixas de premiação (backtest) |
|------------|----------|-------------------|-------------------------|--------------------------------|
| **Lotofácil** | 1–25 | 15 | 15 dezenas | 11, 12, 13, 14, 15 acertos |
| **Mega-Sena** | 1–60 | 6 | 6 dezenas | Quadra (4), Quina (5), Sena (6) |
| **Quina** | 1–80 | 5 | 5 dezenas | Duque (2), Terno (3), Quadra (4), Quina (5) |

### Particularidades

- **Lotofácil:** volante 5×5 — análises extras de linhas/colunas e moldura/miolo  
- **Mega-Sena:** maior universo — atenção a performance em pares/trios  
- **Quina:** sorteios frequentes — janelas móveis podem ser mais estáveis  

Detalhes: [`docs/games/rules.md`](./docs/games/rules.md)

---

## Metodologia analítica

Princípios fundamentais:

1. Sorteios modelados como eventos **aleatórios independentes** no universo do jogo  
2. Métricas são **descritivas** do passado da amostra filtrada  
3. Scores e rankings são **heurísticos** — não são P(ganhar)  
4. Cada modalidade pode ter **extensões** específicas (ex.: grade 5×5 na Lotofácil)  

| Nível | Foco |
|-------|------|
| Básico | Frequência, atraso, paridade, faixas, soma, repetição consecutiva |
| Intermediário | Janelas móveis, tendências multi-horizonte, pares/trios, lift, gaps |
| Avançado | Score composto, Monte Carlo, cobertura, diversidade, explicabilidade |

Documentação completa: [`docs/analytics/methodology.md`](./docs/analytics/methodology.md)

---

## Limitações estatísticas

- **Padrões passados não preveem resultados futuros** em processos genuinamente aleatórios  
- Frequência e atraso são descritivos — interpretar como "deve sair" é falácia do jogador  
- Scores compostos usam **pesos heurísticos** (35% freq, 25% atraso, 25% tendência, 15% desvio)  
- Janelas móveis curtas amplificam **ruído amostral**  
- Correlação entre dezenas **não implica causalidade**  
- Monte Carlo usa distribuição **uniforme simplificada**  
- Backtest walk-forward pode sofrer **overfitting** se usado para ajustar estratégias no mesmo período  
- Amostras pequenas (poucos concursos) geram métricas **instáveis**  

Limitações exibidas em `report.meta.limitations` e nos accordions de metodologia na UI.

---

## Considerações éticas

1. **Transparência:** disclaimers em análises, palpites, backtests e sidebar  
2. **Sem promessa de ganho:** o produto é ferramenta de **estudo**, não consultoria financeira  
3. **Jogo responsável:** loterias são entretenimento; não incentivar apostas além da capacidade financeira do usuário  
4. **Dados oficiais:** resultados vêm da API Caixa; o sistema não altera nem fabrica sorteios  
5. **Privacidade (fase atual):** sem autenticação — palpites ficam no banco local/instância; em produção multiusuário, implementar auth e isolamento  
6. **Uso de IA:** roles/skills/playbooks orientam desenvolvimento — outputs de modelos não substituem validação estatística  

---

## Performance

| Área | Cuidado |
|------|---------|
| **ETL full** | Milhares de concursos — rodar por jogo ou com limite em dev |
| **Analytics** | Relatório completo recalcula tudo em memória — usar `limit` e filtros de concurso |
| **Pares/trios** | Limitados a top N por performance |
| **Backtest** | Walk-forward × 6 estratégias × N concursos — reduzir `windowSize` em dev |
| **Dashboards** | Client-side fetch com filtros; evitar recalcular sem necessidade |
| **Prisma** | Índices em `contestNumber`, `drawDate`, `analysisRunId` |
| **Build** | Páginas estáticas onde possível; APIs dinâmicas para dados |

Detalhes: [`docs/technical/performance.md`](./docs/technical/performance.md)

---

## Decisões técnicas

| Decisão | Motivo |
|---------|--------|
| **Tabelas separadas por jogo** | Regras e volumes diferentes; evita acoplamento e facilita extensão |
| **ETL fora do request HTTP** | Carga histórica é longa; não bloquear API/UI |
| **Motor analítico em memória** | Flexibilidade de filtros; persistência opcional via pipeline |
| **Next.js App Router** | SSR/SSG + API unificada, DX moderna |
| **Prisma** | Tipagem forte, migrations, bom fit com PostgreSQL |
| **Walk-forward no backtest** | Evita look-ahead bias óbvio |
| **Seed em palpites/backtest** | Reprodutibilidade por concurso |
| **JSON metadata** | Flexibilidade para evoluir schema sem migration a cada campo |

Detalhes: [`docs/technical/decisions.md`](./docs/technical/decisions.md)

---

## Pontos de extensão

| Extensão | Como |
|----------|------|
| Nova loteria | Playbook `playbooks/build-new-lottery-module.md` |
| Nova métrica analítica | `analytics/basic|intermediate|advanced` + extension por jogo |
| Nova estratégia de palpite | `prediction/strategies.ts` + tipos |
| Novo adapter ETL | Implementar `DrawSourceAdapter` |
| Auth / multi-tenant | Middleware Next.js + `userId` em predictions/backtests |
| Agendamento | Cron para `etl:incremental` e `analytics:run` |
| Exportação | PDF/CSV dos relatórios e backtests |

Detalhes: [`docs/technical/extensions.md`](./docs/technical/extensions.md)

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |
| `npm run db:push` | Aplicar schema Prisma |
| `npm run db:generate` | Gerar Prisma Client |
| `npm run db:migrate` | Migrations (dev) |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Seed inicial |
| `npm run etl:load` | Carga histórica (todos) |
| `npm run etl:load:{jogo}` | Carga por modalidade |
| `npm run etl:incremental` | Sync incremental (todos) |
| `npm run etl:sync:{jogo}` | Sync por modalidade |
| `npm run etl:reprocess` | Reprocessar intervalo |
| `npm run analytics:run` | Pipeline analítico |
| `npm run predictions:generate` | Gerar palpites CLI |
| `npm run backtest:run` | Backtest CLI |

---

## Documentação adicional

| Documento | Conteúdo |
|-----------|----------|
| [`docs/README.md`](./docs/README.md) | Índice da documentação |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Arquitetura e modelagem |
| [`AI-DEVELOPMENT.md`](./AI-DEVELOPMENT.md) | Desenvolvimento assistido por IA |
| [`docs/analytics/`](./docs/analytics/) | Motor analítico |
| [`docs/predictions/`](./docs/predictions/) | Gerador de palpites |
| [`docs/backtest/`](./docs/backtest/) | Backtest |
| [`docs/frontend/`](./docs/frontend/) | Dashboards |
| [`docs/data-sources/`](./docs/data-sources/) | Fontes de dados |
| [`scripts/etl/README.md`](./scripts/etl/README.md) | ETL |
| [`roles/`](./roles/) · [`skills/`](./skills/) · [`playbooks/`](./playbooks/) | Guias para agentes |

---

## Próximos passos

### Produto
- [ ] Autenticação e perfis de usuário  
- [ ] Agendamento automático de sync e análises  
- [ ] Exportação de relatórios (PDF/CSV)  
- [ ] Notificações de novo concurso  

### Técnico
- [ ] Migrations Prisma versionadas (além de `db:push`)  
- [ ] Testes automatizados (ETL, analytics, backtest)  
- [ ] CI/CD (GitHub Actions)  
- [ ] Cache de relatórios analíticos (Redis ou materialized views)  
- [ ] Otimização de backtest em lote (paralelização)  

### Analítico
- [ ] Novas modalidades (Lotomania, Timemania, etc.)  
- [ ] Calibração de pesos via validação cruzada (com avisos de overfitting)  
- [ ] Intervalos de confiança nas métricas de backtest  

---

## Licença

Projeto privado — uso conforme definido pelo mantenedor do repositório.

---

*Loteria Analytics — estudo estatístico com responsabilidade. Jogue com moderação.*
