# Playbook: Ingest Historical Data

## Objetivo

Sincronizar **todos ou parte** dos concursos históricos de um jogo a partir da API Caixa, com banco preparado, seed aplicado e rastreio em `import_batches`.

## Responsabilidades

- Subir PostgreSQL e configurar `.env`
- Executar migrações e seed
- Rodar sync por jogo ou all
- Verificar integridade pós-ingestão
- Opcionalmente disparar pipeline analítico

## Entradas

- Docker + `DATABASE_URL`
- `npm install` concluído
- Skills: `historical-ingestion`, `prisma-schema-design`
- Role: `data-engineer`

## Saídas

- Registros em `{jogo}_draws`
- `ImportBatch` SUCCESS com métricas
- Log sem erros críticos
- Contagem conferida vs API (último concurso)

## Padrões

```bash
# 1. Infra
docker compose up -d
cp .env.example .env

# 2. Banco
npm install
npm run db:push
npm run db:generate
npm run db:seed

# 3. Sync (escolha um)
npm run etl:sync:lotofacil
npm run etl:sync          # todos os jogos

# 4. Verificação
npm run db:studio
```

Sync parcial para teste: UI em `/importacao` com `maxContests` ou argumento CLI.

## Checklist

- [ ] Postgres healthy (`docker ps`)
- [ ] `DataSource` CAIXA_API no banco
- [ ] Seed sem erro
- [ ] Sync completa sem FAILED (ou PARTIAL documentado)
- [ ] `contestsTotal` > 0 no batch
- [ ] Último concurso bate com site Caixa
- [ ] Amostra de 3 concursos: `validateDraw` ok
- [ ] `importBatchId` preenchido nos draws (se implementado no repo)
- [ ] Análises invalidadas/recalculadas se pipeline ativo

## Pitfalls

- Sync sem seed → erro "CAIXA_API não encontrada"
- Firewall bloqueando API Caixa
- Interromper sync no meio — re-run é incremental (ok)
- `db push` em schema desatualizado
- Confundir `contestsAdded` com total histórico

## Exemplos práticos

**Verificação SQL:**

```sql
SELECT COUNT(*), MAX(contest_number) FROM lotofacil_draws;
SELECT status, contests_added, contests_total FROM import_batches ORDER BY started_at DESC LIMIT 5;
```

**API via app:**

```http
POST /api/sync
{ "game": "quina", "maxContests": 50 }
```

**Após ingestão:**

```bash
npm run dev
# Acessar /lotofacil — deve mostrar KPIs > 0
```
