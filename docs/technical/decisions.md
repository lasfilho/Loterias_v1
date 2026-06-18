# Decisões técnicas

Registro das principais decisões arquiteturais do **Loteria Analytics** e seus trade-offs.

---

## 1. Monólito modular (Next.js full-stack)

**Decisão:** Frontend, API e orquestração no mesmo repositório Next.js.

**Motivo:** Time pequeno, deploy simplificado, tipos compartilhados entre UI e serviços.

**Trade-off:** Escalar ETL/analytics pesados pode exigir workers separados no futuro.

---

## 2. Tabelas Prisma separadas por jogo

**Decisão:** `lotofacil_draws`, `megasena_draws`, `quina_draws` (e predictions equivalentes) em vez de tabela única polimórfica.

**Motivo:**
- Regras e universos numéricos diferentes  
- Queries mais simples e índices específicos  
- Extensão para nova loteria sem migrar dados existentes  

**Trade-off:** Código repetitivo em repositórios — mitigado por `base-repository` e registry.

---

## 3. ETL como scripts CLI, não API síncrona

**Decisão:** Carga histórica via `scripts/etl/*.ts`; API `/api/sync` para incrementais limitados.

**Motivo:** Importação completa pode levar minutos e milhares de requests à API Caixa.

**Trade-off:** UX de “um clique importa tudo” na UI pode timeout — usar `maxContests` ou jobs em background (futuro).

---

## 4. Motor analítico v2 em memória

**Decisão:** `AnalyticsEngine.compute()` recalcula indicadores a partir dos draws carregados; persistência opcional via `analyticsPipeline`.

**Motivo:** Filtros dinâmicos (concurso, data, limite) sem pré-agregar todas as combinações.

**Trade-off:** Relatório completo em histórico muito longo é CPU-intensivo — usar filtros e `limit`.

---

## 5. Camadas basic / intermediate / advanced

**Decisão:** Relatório estruturado em três níveis + extensão por jogo.

**Motivo:** Dashboards consomem subsets; documentação e evolução incremental.

**Trade-off:** Alguma redundância com campos legados no topo de `FullAnalyticsReport` (compatibilidade).

---

## 6. PredictionGenerator acoplado ao AnalyticsEngine

**Decisão:** Palpites usam o mesmo relatório analítico que os dashboards.

**Motivo:** Consistência entre o que o usuário vê e o que o gerador usa.

**Trade-off:** Gerar palpite recalcula analytics — aceitável para uso interativo; batch pode otimizar.

---

## 7. Backtest walk-forward com seed fixo

**Decisão:** Para cada concurso de teste, treino = concursos anteriores; seed derivado do `contestNumber`.

**Motivo:** Evitar look-ahead bias; reprodutibilidade.

**Trade-off:** Não otimiza hiperparâmetros no período de teste (proposital, para reduzir overfitting).

---

## 8. JSON em metadata Prisma

**Decisão:** Campos `metadata`, `hitRateByLevel`, `parameters` etc. como `Json`.

**Motivo:** Evolução rápida de schema de relatórios sem migration a cada campo novo.

**Trade-off:** Menos queryabilidade SQL nativa — aceitável para relatórios consumidos pela app.

---

## 9. Tailwind 4 + tokens CSS

**Decisão:** Design tokens em `globals.css` (`:root` / `.dark`), sem `tailwind.config.js`.

**Motivo:** Alinhado ao Tailwind v4; tema claro/escuro via classe no `<html>`.

---

## 10. Sem autenticação na v1

**Decisão:** Dashboard aberto na instância local/deploy single-tenant.

**Motivo:** Foco em motor analítico e UX; auth planejada para fase 2.

**Trade-off:** Não deployar publicamente sem auth em produção multiusuário.

---

## Referências

- [`ARCHITECTURE.md`](../../ARCHITECTURE.md)  
- [`docs/architecture/overview.md`](../architecture/overview.md)
