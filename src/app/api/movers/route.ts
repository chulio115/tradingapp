import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const dateStr = searchParams.get("date");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (dateStr) {
      const date = new Date(dateStr);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = { gte: date, lt: nextDay };
    }

    const movers = await prisma.marketMover.findMany({
      where,
      orderBy: { changePercent: type === "loser" ? "asc" : "desc" },
      take: 20,
    });

    return Response.json({
      movers: movers.map((m) => ({
        ...m,
        volume: m.volume ? Number(m.volume) : null,
        date: m.date.toISOString(),
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch movers:", error);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: "Failed to fetch movers", detail: message }, { status: 500 });
  }
}
