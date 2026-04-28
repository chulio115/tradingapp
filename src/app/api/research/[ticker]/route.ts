import type { NextRequest } from "next/server";
import { getResearchData } from "@/lib/analyzer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
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
