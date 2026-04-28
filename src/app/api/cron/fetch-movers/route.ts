import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getTrendingStocks } from "@/lib/yahoo";

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

    // Split into gainers and losers based on change
    const gainers = movers.filter((m) => m.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent);
    const losers = movers.filter((m) => m.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent);

    for (const mover of gainers.slice(0, 10)) {
      try {
        await prisma.marketMover.upsert({
          where: {
            date_ticker_type: {
              date: today,
              ticker: mover.symbol,
              type: "gainer",
            },
          },
          update: {
            price: mover.price,
            change: mover.change,
            changePercent: mover.changePercent,
          },
          create: {
            date: today,
            ticker: mover.symbol,
            companyName: mover.name,
            price: mover.price,
            change: mover.change,
            changePercent: mover.changePercent,
            type: "gainer",
          },
        });
        inserted++;
      } catch {
        skipped++;
      }
    }

    for (const mover of losers.slice(0, 10)) {
      try {
        await prisma.marketMover.upsert({
          where: {
            date_ticker_type: {
              date: today,
              ticker: mover.symbol,
              type: "loser",
            },
          },
          update: {
            price: mover.price,
            change: mover.change,
            changePercent: mover.changePercent,
          },
          create: {
            date: today,
            ticker: mover.symbol,
            companyName: mover.name,
            price: mover.price,
            change: mover.change,
            changePercent: mover.changePercent,
            type: "loser",
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
      gainersCount: gainers.length,
      losersCount: losers.length,
    });
  } catch (error) {
    console.error("Cron fetch-movers failed:", error);
    return Response.json(
      { error: "Failed to fetch movers" },
      { status: 500 }
    );
  }
}
