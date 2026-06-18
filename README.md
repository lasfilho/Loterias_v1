# Loteria Analytics

Plataforma profissional de análise estatística e probabilística para **Lotofácil**, **Mega-Sena** e **Quina**.

> Análises baseadas em dados históricos. Sem garantia de previsão.

## Stack

- Next.js 15 + TypeScript
- PostgreSQL + Prisma
- Tailwind CSS 4 + Recharts
- ETL via scripts TypeScript

## Início Rápido

```bash
# 1. Subir PostgreSQL
docker compose up -d

# 2. Configurar ambiente
cp .env.example .env

# 3. Instalar dependências
npm install

# 4. Preparar banco
npm run db:push
npm run db:generate

# 5. Sincronizar dados (teste com limite)
npm run etl:sync:lotofacil 100

# 6. Desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura

Consulte [ARCHITECTURE.md](./ARCHITECTURE.md) para detalhes da arquitetura, modelagem e plano de execução.

## Funcionalidades

- Dashboard principal e por modalidade
- Importação/sincronização via API Caixa
- Análises: frequência, atraso, pares, par/ímpar, faixas
- Geração de palpites com 5 estratégias configuráveis
- Histórico de palpites salvos
- Filtros avançados por concurso

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run etl:sync` | Sincronizar todos os jogos |
| `npm run etl:sync:lotofacil` | Sincronizar Lotofácil |
| `npm run db:studio` | Prisma Studio |
