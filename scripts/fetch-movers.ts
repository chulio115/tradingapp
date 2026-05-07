import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getTrendingStocks, type YahooMover } from "../src/lib/yahoo";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter }) as unknown as PrismaClient;
}

async function main() {
  const prisma = createPrismaClient();
  const movers = await getTrendingStocks();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  const validMovers = movers.filter((m) => {
    const valid =
      m.symbol &&
      m.name &&
      Number.isFinite(m.price) &&
      Number.isFinite(m.change) &&
      Number.isFinite(m.changePercent);

    if (!valid) {
      skipped++;
      errors.push(`Invalid mover data for ${m.symbol || "unknown"}`);
    }

    return valid;
  });

  const gainers = validMovers
    .filter((m) => m.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent);
  const losers = validMovers
    .filter((m) => m.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent);

  async function upsertMover(mover: YahooMover, type: "gainer" | "loser") {
    try {
      await prisma.marketMover.upsert({
        where: {
          date_ticker_type: {
            date: today,
            ticker: mover.symbol,
            type,
          },
        },
        update: {
          price: mover.price,
          change: mover.change,
          changePercent: mover.changePercent,
          volume: Number.isFinite(mover.volume) ? BigInt(Math.trunc(mover.volume)) : null,
        },
        create: {
          date: today,
          ticker: mover.symbol,
          companyName: mover.name,
          price: mover.price,
          change: mover.change,
          changePercent: mover.changePercent,
          volume: Number.isFinite(mover.volume) ? BigInt(Math.trunc(mover.volume)) : null,
          type,
        },
      });
      inserted++;
    } catch (error) {
      skipped++;
      errors.push(`${mover.symbol} (${type}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const mover of gainers.slice(0, 10)) await upsertMover(mover, "gainer");
  for (const mover of losers.slice(0, 10)) await upsertMover(mover, "loser");

  await prisma.$disconnect();

  const result = {
    success: true,
    inserted,
    skipped,
    gainersCount: gainers.length,
    losersCount: losers.length,
    errors: errors.slice(0, 10),
  };
  console.log(JSON.stringify(result, null, 2));

  if (inserted === 0 && errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
