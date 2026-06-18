# Loteria Analytics — Arquitetura

## Visão Geral

Sistema analítico modular para estudo estatístico de resultados oficiais das loterias brasileiras (Lotofácil, Mega-Sena e Quina), com separação total por modalidade em domínio, persistência, serviços e interface.

> **Aviso:** As análises são baseadas em dados históricos e modelos probabilísticos. Não há garantia de acerto ou previsão.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Backend | Next.js API Routes + Server Actions |
| Banco | PostgreSQL 16 |
| ORM | Prisma |
| ETL | Scripts TypeScript (`tsx`) |
| Charts | Recharts |
| UI | Tailwind CSS 4 + componentes shadcn-style |
| Validação | Zod |

## Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  Landing │ Dashboards │ Análises │ Palpites │ Import    │
└──────────────────────────┬──────────────────────────────┘
                           │ API Routes / Server Actions
┌──────────────────────────▼──────────────────────────────┐
│              Application Services (modules/)             │
│  lotofacil │ megasena │ quina │ shared                 │
│  analytics │ prediction │ repository │ rules            │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    ETL (scripts/etl/)                    │
│  Caixa API → Normalização → Upsert por modalidade       │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│              PostgreSQL (tabelas separadas)              │
└─────────────────────────────────────────────────────────┘
```

## Estrutura de Pastas

```
src/
├── app/                          # Rotas Next.js
│   ├── (marketing)/              # Landing pública
│   ├── (dashboard)/              # Área autenticada/analítica
│   │   ├── dashboard/
│   │   ├── lotofacil/
│   │   ├── megasena/
│   │   ├── quina/
│   │   ├── importacao/
│   │   ├── analises/
│   │   ├── palpites/
│   │   └── configuracoes/
│   └── api/                      # REST endpoints
├── components/
│   ├── ui/                       # Design system
│   ├── charts/                   # Gráficos Recharts
│   ├── layout/                   # Sidebar, header
│   └── domain/                   # Componentes por jogo
├── lib/                          # Utilitários, DB client
└── modules/
    ├── shared/                   # Tipos, regras base, ETL client
    ├── lotofacil/                # Domínio Lotofácil
    ├── megasena/                 # Domínio Mega-Sena
    └── quina/                    # Domínio Quina
scripts/
└── etl/                          # Jobs de sincronização
prisma/
└── schema.prisma                 # Modelos separados por jogo
```

## Modelagem de Domínio

### Regras por Modalidade

| Jogo | Universo | Sorteados | Aposta mínima |
|------|----------|-----------|---------------|
| Lotofácil | 1–25 | 15 | 15 números |
| Mega-Sena | 1–60 | 6 | 6 números |
| Quina | 1–80 | 5 | 5 números |

### Entidades

- **Draw** — Concurso oficial (número, data, dezenas, prêmio)
- **Prediction** — Palpite gerado (números, estratégia, metadados)
- **SyncLog** — Histórico de sincronizações ETL
- **AppSettings** — Configurações globais e por jogo

### Motor Analítico

- Frequência absoluta e relativa
- Atraso (concursos desde última aparição)
- Tendência (janela móvel)
- Pares e trios recorrentes
- Distribuição par/ímpar, alto/baixo
- Heatmap de coocorrência

### Geração de Palpites

Estratégias configuráveis:
- `FREQUENCY_WEIGHTED` — ponderação por frequência histórica
- `DELAY_BALANCED` — equilíbrio entre números atrasados e frequentes
- `HOT_COLD_MIX` — mistura de quentes e frios
- `PATTERN_AWARE` — respeita padrões par/ímpar e faixas
- `HYBRID` — combinação ponderada das anteriores

## Plano de Execução

1. ✅ Scaffold do projeto e dependências
2. ✅ Schema Prisma e módulos de domínio
3. ✅ ETL de sincronização com API Caixa
4. ✅ Serviços analíticos e geração de palpites
5. ✅ API routes REST
6. ✅ Dashboards e UI premium
7. ⬜ Autenticação opcional (NextAuth) — fase 2

## Como Executar

```bash
# Subir PostgreSQL
docker compose up -d

# Configurar ambiente
cp .env.example .env

# Instalar e preparar banco
npm install
npm run db:push
npm run db:generate

# Sincronizar dados históricos
npm run etl:sync

# Desenvolvimento
npm run dev
```
