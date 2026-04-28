import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chamber = searchParams.get("chamber");
    const party = searchParams.get("party");
    const ticker = searchParams.get("ticker");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    let query = supabase
      .from("CongressTrade")
      .select("*", { count: "exact" })
      .order("filingDate", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (chamber) query = query.eq("chamber", chamber);
    if (party) query = query.eq("party", party);
    if (ticker) query = query.ilike("ticker", `%${ticker}%`);

    const { data: trades, count, error } = await query;

    if (error) throw error;

    return Response.json({
      trades: trades ?? [],
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch (error) {
    console.error("Failed to fetch trades:", error);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: "Failed to fetch trades", detail: message }, { status: 500 });
  }
}
