import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const dateStr = searchParams.get("date");

    let query = supabase
      .from("MarketMover")
      .select("*")
      .order("changePercent", { ascending: type === "loser" })
      .limit(20);

    if (type) query = query.eq("type", type);
    if (dateStr) {
      const date = new Date(dateStr);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.gte("date", date.toISOString()).lt("date", nextDay.toISOString());
    }

    const { data: movers, error } = await query;

    if (error) throw error;

    return Response.json({
      movers: (movers ?? []).map((m) => ({
        ...m,
        volume: m.volume ? Number(m.volume) : null,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch movers:", error);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: "Failed to fetch movers", detail: message }, { status: 500 });
  }
}
