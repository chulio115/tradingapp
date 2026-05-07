import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { fetchHouseFilings } from "../src/lib/congress-scraper";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter }) as unknown as PrismaClient;
}

async function main() {
  const prisma = createPrismaClient();
  const filings = await fetchHouseFilings();

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const filing of filings) {
    try {
      await prisma.congressTrade.upsert({
        where: {
          politician_ticker_transactionDate_transactionType: {
            politician: filing.politician,
            ticker: `PTR-${filing.docId}`,
            transactionDate: new Date(filing.filingDate),
            transactionType: "Periodic Transaction Report",
          },
        },
        update: {},
        create: {
          chamber: filing.chamber,
          politician: filing.politician,
          party: "Unknown",
          state: filing.state,
          ticker: `PTR-${filing.docId}`,
          companyName: `Filing ${filing.docId}`,
          transactionType: "Periodic Transaction Report",
          amount: "See PDF",
          transactionDate: new Date(filing.filingDate),
          filingDate: new Date(filing.filingDate),
          assetType: filing.pdfUrl,
        },
      });
      inserted++;
    } catch (error) {
      skipped++;
      errors.push(`${filing.docId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  await prisma.$disconnect();

  console.log(JSON.stringify({ success: true, inserted, skipped, total: filings.length, errors: errors.slice(0, 10) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
