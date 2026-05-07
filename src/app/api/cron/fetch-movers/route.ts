import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getTrendingStocks, type YahooMover } from "@/lib/yahoo";

function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get("x-cron-secret");
  return secret === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const movers = await getTrendingStocks();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    // Split into gainers and losers based on change
    const gainers = validMovers.filter((m) => m.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent);
    const losers = validMovers.filter((m) => m.changePercent < 0)
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
        errors.push(
          `${mover.symbol} (${type}): ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    for (const mover of gainers.slice(0, 10)) {
      await upsertMover(mover, "gainer");
    }

    for (const mover of losers.slice(0, 10)) {
      await upsertMover(mover, "loser");
    }

    return Response.json({
      success: true,
      inserted,
      skipped,
      gainersCount: gainers.length,
      losersCount: losers.length,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error("Cron fetch-movers failed:", error);
    return Response.json(
      { error: "Failed to fetch movers" },
      { status: 500 }
    );
  }
}
