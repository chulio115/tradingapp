import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

const STALE_THRESHOLD_HOURS = 8;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const dateStr = searchParams.get("date");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    let targetDate: Date | null = null;
    let latestAvailableDate: string | null = null;

    if (dateStr) {
      targetDate = new Date(dateStr);
      latestAvailableDate = targetDate.toISOString();
    } else {
      const latestQuery = supabase
        .from("MarketMover")
        .select("date")
        .order("date", { ascending: false })
        .limit(1);

      const { data: latestRows, error: latestError } = type
        ? await latestQuery.eq("type", type)
        : await latestQuery;

      if (latestError) throw latestError;

      latestAvailableDate = latestRows?.[0]?.date ?? null;
      targetDate = latestAvailableDate ? new Date(latestAvailableDate) : null;
    }

    let query = supabase
      .from("MarketMover")
      .select("*")
      .order("changePercent", { ascending: type === "loser" })
      .limit(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 20);

    if (type) query = query.eq("type", type);
    if (targetDate) {
      const date = new Date(targetDate);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.gte("date", date.toISOString()).lt("date", nextDay.toISOString());
    }

    const { data: movers, error } = await query;

    if (error) throw error;

    const asOf = latestAvailableDate ?? null;
    const ageHours = asOf
      ? (Date.now() - new Date(asOf).getTime()) / (1000 * 60 * 60)
      : null;

    return Response.json({
      movers: (movers ?? []).map((m) => ({
        ...m,
        volume: m.volume ? Number(m.volume) : null,
      })),
      asOf,
      latestAvailableDate,
      isStale: ageHours === null ? true : ageHours > STALE_THRESHOLD_HOURS,
      staleThresholdHours: STALE_THRESHOLD_HOURS,
    });
  } catch (error) {
    console.error("Failed to fetch movers:", error);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: "Failed to fetch movers", detail: message }, { status: 500 });
  }
}
