import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  sendTelegramMessage,
  formatCongressTradeAlert,
  formatMoverAlert,
} from "@/lib/telegram";
import type { CongressTradeConditions, MarketMoverConditions } from "@/types";

function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get("x-cron-secret");
  return secret === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rules = await prisma.alertRule.findMany({
      where: { active: true },
    });

    let alertsSent = 0;

    for (const rule of rules) {
      const conditions = JSON.parse(rule.conditions) as Record<string, unknown>;

      if (rule.type === "congress_trade") {
        const conds = conditions as CongressTradeConditions;
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const where: Record<string, unknown> = {
          filingDate: { gte: oneDayAgo },
        };

        if (conds.transactionType) {
          where.transactionType = conds.transactionType;
        }
        if (conds.politicians?.length) {
          where.politician = { in: conds.politicians };
        }
        if (conds.tickers?.length) {
          where.ticker = { in: conds.tickers };
        }

        const trades = await prisma.congressTrade.findMany({ where });

        for (const trade of trades) {
          const alreadySent = await prisma.alertLog.findFirst({
            where: {
              ruleId: rule.id,
              message: { contains: trade.id },
            },
          });

          if (alreadySent) continue;

          const message = formatCongressTradeAlert({
            politician: trade.politician,
            party: trade.party,
            ticker: trade.ticker,
            transactionType: trade.transactionType,
            amount: trade.amount,
            chamber: trade.chamber,
          });

          const success = await sendTelegramMessage(message);

          await prisma.alertLog.create({
            data: {
              ruleId: rule.id,
              message: `Trade ${trade.id}: ${message}`,
              success,
            },
          });

          if (success) alertsSent++;
        }
      }

      if (rule.type === "market_mover") {
        const conds = conditions as MarketMoverConditions;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const where: Record<string, unknown> = {
          date: { gte: today },
        };

        if (conds.direction === "up") where.type = "gainer";
        if (conds.direction === "down") where.type = "loser";

        const movers = await prisma.marketMover.findMany({ where });

        for (const mover of movers) {
          if (
            conds.minChangePercent &&
            Math.abs(mover.changePercent) < conds.minChangePercent
          ) {
            continue;
          }

          const alreadySent = await prisma.alertLog.findFirst({
            where: {
              ruleId: rule.id,
              message: { contains: mover.id },
            },
          });

          if (alreadySent) continue;

          const message = formatMoverAlert({
            ticker: mover.ticker,
            companyName: mover.companyName,
            changePercent: mover.changePercent,
            type: mover.type,
          });

          const success = await sendTelegramMessage(message);

          await prisma.alertLog.create({
            data: {
              ruleId: rule.id,
              message: `Mover ${mover.id}: ${message}`,
              success,
            },
          });

          if (success) alertsSent++;
        }
      }
    }

    return Response.json({
      success: true,
      rulesChecked: rules.length,
      alertsSent,
    });
  } catch (error) {
    console.error("Cron check-alerts failed:", error);
    return Response.json(
      { error: "Failed to check alerts" },
      { status: 500 }
    );
  }
}
