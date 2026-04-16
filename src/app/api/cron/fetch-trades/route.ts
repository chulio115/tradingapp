import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSenateTrades, getHouseTrades } from "@/lib/fmp";

function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get("x-cron-secret");
  return secret === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [senateTrades, houseTrades] = await Promise.all([
      getSenateTrades(),
      getHouseTrades(),
    ]);

    let inserted = 0;
    let skipped = 0;

    for (const trade of senateTrades) {
      if (!trade.ticker) continue;
      try {
        await prisma.congressTrade.upsert({
          where: {
            politician_ticker_transactionDate_transactionType: {
              politician: trade.senator || `${trade.firstName} ${trade.lastName}`,
              ticker: trade.ticker,
              transactionDate: new Date(trade.transactionDate),
              transactionType: trade.type,
            },
          },
          update: {},
          create: {
            chamber: "senate",
            politician: trade.senator || `${trade.firstName} ${trade.lastName}`,
            party: inferParty(trade.senator || `${trade.firstName} ${trade.lastName}`),
            state: extractState(trade.office),
            ticker: trade.ticker,
            companyName: trade.assetDescription,
            transactionType: trade.type,
            amount: trade.amount,
            transactionDate: new Date(trade.transactionDate),
            filingDate: new Date(trade.dateRecieved),
            assetType: trade.assetType,
          },
        });
        inserted++;
      } catch {
        skipped++;
      }
    }

    for (const trade of houseTrades) {
      if (!trade.ticker) continue;
      try {
        await prisma.congressTrade.upsert({
          where: {
            politician_ticker_transactionDate_transactionType: {
              politician:
                trade.representative || `${trade.firstName} ${trade.lastName}`,
              ticker: trade.ticker,
              transactionDate: new Date(trade.transactionDate),
              transactionType: trade.type,
            },
          },
          update: {},
          create: {
            chamber: "house",
            politician:
              trade.representative || `${trade.firstName} ${trade.lastName}`,
            party: inferParty(
              trade.representative || `${trade.firstName} ${trade.lastName}`
            ),
            state: trade.district || null,
            ticker: trade.ticker,
            companyName: trade.assetDescription,
            transactionType: trade.type,
            amount: trade.amount,
            transactionDate: new Date(trade.transactionDate),
            filingDate: new Date(trade.dateRecieved),
            assetType: null,
          },
        });
        inserted++;
      } catch {
        skipped++;
      }
    }

    return Response.json({
      success: true,
      inserted,
      skipped,
      total: senateTrades.length + houseTrades.length,
    });
  } catch (error) {
    console.error("Cron fetch-trades failed:", error);
    return Response.json(
      { error: "Failed to fetch trades" },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function inferParty(_name: string): string {
  return "Unknown";
}

function extractState(office: string): string | null {
  if (!office) return null;
  const match = office.match(/\(([A-Z]{2})\)/);
  return match ? match[1] : null;
}
