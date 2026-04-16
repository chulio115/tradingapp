import type { NextRequest } from "next/server";
import { getResearchData } from "@/lib/analyzer";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/research/[ticker]">
) {
  try {
    const { ticker } = await ctx.params;
    const data = await getResearchData(ticker.toUpperCase());
    return Response.json(data);
  } catch (error) {
    console.error("Research data fetch failed:", error);
    return Response.json(
      { error: "Failed to fetch research data" },
      { status: 500 }
    );
  }
}
