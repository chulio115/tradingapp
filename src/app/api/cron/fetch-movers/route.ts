import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getBiggestGainers, getBiggestLosers } from "@/lib/fmp";

function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get("x-cron-secret");
  return secret === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [gainers, losers] = await Promise.all([
      getBiggestGainers(),
      getBiggestLosers(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let inserted = 0;
    let skipped = 0;

    for (const mover of gainers.slice(0, 20)) {
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
            changePercent: mover.changesPercentage,
          },
          create: {
            date: today,
            ticker: mover.symbol,
            companyName: mover.name,
            price: mover.price,
            change: mover.change,
            changePercent: mover.changesPercentage,
            type: "gainer",
          },
        });
        inserted++;
      } catch {
        skipped++;
      }
    }

    for (const mover of losers.slice(0, 20)) {
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
            changePercent: mover.changesPercentage,
          },
          create: {
            date: today,
            ticker: mover.symbol,
            companyName: mover.name,
            price: mover.price,
            change: mover.change,
            changePercent: mover.changesPercentage,
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
