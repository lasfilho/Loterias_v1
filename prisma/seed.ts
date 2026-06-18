import { PrismaClient, DataSourceType, GameType, PredictionStrategy } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const caixaApi = await prisma.dataSource.upsert({
    where: { code: "CAIXA_API" },
    update: {},
    create: {
      code: "CAIXA_API",
      name: "API Portal de Loterias — Caixa",
      type: DataSourceType.CAIXA_API,
      baseUrl: "https://servicebus2.caixa.gov.br/portaldeloterias/api",
      isActive: true,
    },
  });

  await prisma.dataSource.upsert({
    where: { code: "CSV_IMPORT" },
    update: {},
    create: {
      code: "CSV_IMPORT",
      name: "Importação manual via CSV",
      type: DataSourceType.CSV_FILE,
      isActive: true,
    },
  });

  for (const gameType of [GameType.LOTOFACIL, GameType.MEGASENA, GameType.QUINA]) {
    await prisma.gameSettings.upsert({
      where: { gameType },
      update: {},
      create: {
        gameType,
        settings: {
          defaultAnalysisWindow: null,
          trendWindowSize: 20,
          hotColdThreshold: 0.2,
        },
      },
    });

    await prisma.predictionConfig.upsert({
      where: {
        gameType_slug: { gameType, slug: "default-hybrid" },
      },
      update: {},
      create: {
        gameType,
        name: "Híbrido padrão",
        slug: "default-hybrid",
        strategy: PredictionStrategy.HYBRID,
        isDefault: true,
        isActive: true,
        strategyWeights: {
          FREQUENCY_WEIGHTED: 0.25,
          DELAY_BALANCED: 0.25,
          HOT_COLD_MIX: 0.2,
          PATTERN_AWARE: 0.15,
          HYBRID: 0.15,
        },
        constraints: {},
        description: "Configuração padrão de geração assistida de palpites",
      },
    });
  }

  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      settings: {
        defaultDataSourceId: caixaApi.id,
        disclaimer:
          "Análises baseadas em dados históricos. Não constitui garantia de resultado.",
      },
    },
  });

  console.log("Seed concluído: fontes de dados, configs e settings criados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
