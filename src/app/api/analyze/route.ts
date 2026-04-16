import { NextRequest } from "next/server";
import { getResearchData, getAIAnalysis } from "@/lib/analyzer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker, tradeContext } = body as {
      ticker: string;
      tradeContext?: string;
    };

    if (!ticker) {
      return Response.json({ error: "Ticker is required" }, { status: 400 });
    }

    const data = await getResearchData(ticker.toUpperCase());
    const analysis = await getAIAnalysis(ticker.toUpperCase(), data, tradeContext);

    return Response.json({ analysis });
  } catch (error) {
    console.error("AI analysis failed:", error);
    return Response.json(
      { error: "AI analysis failed" },
      { status: 500 }
    );
  }
}
