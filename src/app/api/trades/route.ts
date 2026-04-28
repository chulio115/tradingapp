import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chamber = searchParams.get("chamber");
    const party = searchParams.get("party");
    const ticker = searchParams.get("ticker");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const where: Record<string, unknown> = {};
    if (chamber) where.chamber = chamber;
    if (party) where.party = party;
    if (ticker) where.ticker = { contains: ticker, mode: "insensitive" };

    const [trades, total] = await Promise.all([
      prisma.congressTrade.findMany({
        where,
        orderBy: { filingDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.congressTrade.count({ where }),
    ]);

    return Response.json({
      trades: trades.map((t) => ({
        ...t,
        transactionDate: t.transactionDate.toISOString(),
        filingDate: t.filingDate.toISOString(),
        createdAt: t.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch trades:", error);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: "Failed to fetch trades", detail: message }, { status: 500 });
  }
}
