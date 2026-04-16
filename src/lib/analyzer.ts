import type { ResearchCardData, NewsItem } from "@/types";
import * as fmp from "./fmp";
import * as eodhd from "./eodhd";
import { prisma } from "./db";

export async function getResearchData(
  ticker: string
): Promise<ResearchCardData> {
  const [profile, quote, fmpNews, eodhdNews, historicalPrices, sentiment] =
    await Promise.allSettled([
      fmp.getCompanyProfile(ticker),
      fmp.getStockQuote(ticker),
      fmp.getCompanyNews(ticker, 5),
      eodhd.getCompanyNews(ticker, 10),
      fmp.getHistoricalPrices(ticker, 30),
      eodhd.getSentiment(ticker, 30),
    ]);

  const allNews = deduplicateNews([
    ...(fmpNews.status === "fulfilled" ? fmpNews.value : []),
    ...(eodhdNews.status === "fulfilled" ? eodhdNews.value : []),
  ]);

  const congressTrades = await prisma.congressTrade.findMany({
    where: { ticker },
    orderBy: { transactionDate: "desc" },
    take: 10,
  });

  const serializedTrades = congressTrades.map((t) => ({
    ...t,
    transactionDate: t.transactionDate.toISOString(),
    filingDate: t.filingDate.toISOString(),
    createdAt: t.createdAt.toISOString(),
  }));

  return {
    profile: profile.status === "fulfilled" ? profile.value : null,
    quote: quote.status === "fulfilled" ? quote.value : null,
    news: allNews.slice(0, 10),
    historicalPrices:
      historicalPrices.status === "fulfilled" ? historicalPrices.value : [],
    sentiment:
      sentiment.status === "fulfilled" ? sentiment.value : null,
    congressTrades: serializedTrades as ResearchCardData["congressTrades"],
  };
}

function deduplicateNews(news: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return news.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getAIAnalysis(
  ticker: string,
  data: ResearchCardData,
  tradeContext?: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "AI-Analyse nicht verfuegbar: ANTHROPIC_API_KEY nicht konfiguriert.";
  }

  const prompt = buildAnalysisPrompt(ticker, data, tradeContext);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Claude API error:", errText);
      return "AI-Analyse fehlgeschlagen. Bitte spaeter erneut versuchen.";
    }

    const result = await res.json();
    return (
      result.content?.[0]?.text ??
      "Keine Analyse generiert."
    );
  } catch (error) {
    console.error("AI analysis failed:", error);
    return "AI-Analyse fehlgeschlagen. Bitte spaeter erneut versuchen.";
  }
}

function buildAnalysisPrompt(
  ticker: string,
  data: ResearchCardData,
  tradeContext?: string
): string {
  const newsSummary = data.news
    .slice(0, 5)
    .map((n) => `- ${n.title} (${n.source})`)
    .join("\n");

  const priceInfo = data.quote
    ? `Kurs: $${data.quote.price}, Tagesveraenderung: ${data.quote.changesPercentage.toFixed(2)}%`
    : "Kursdaten nicht verfuegbar";

  const profileInfo = data.profile
    ? `Sektor: ${data.profile.sector}, Branche: ${data.profile.industry}, MarketCap: $${(data.profile.mktCap / 1e9).toFixed(2)}B`
    : "Profildaten nicht verfuegbar";

  const sentimentInfo = data.sentiment
    ? `Sentiment Score: ${data.sentiment.avgSentiment.toFixed(3)} (${data.sentiment.totalMentions} Mentions, ${data.sentiment.dataPoints} Datenpunkte, letzter Wert: ${data.sentiment.latestSentiment.toFixed(3)} am ${data.sentiment.latestDate})`
    : "Sentiment nicht verfuegbar";

  const congressInfo =
    data.congressTrades.length > 0
      ? data.congressTrades
          .slice(0, 5)
          .map(
            (t) =>
              `- ${t.politician} (${t.party}): ${t.transactionType} ${t.amount} am ${t.transactionDate}`
          )
          .join("\n")
      : "Keine Congressional Trades fuer diesen Ticker";

  return `Du bist ein Finanzanalyst. Analysiere folgende Daten zu ${ticker}:

${tradeContext ? `Congressional Trade: ${tradeContext}\n` : ""}
Aktuelle News:
${newsSummary || "Keine aktuellen News"}

${priceInfo}
${profileInfo}
${sentimentInfo}

Congressional Trades:
${congressInfo}

Beantworte:
1) Was war wahrscheinlich der Ausloeser fuer diesen Trade/diese Bewegung?
2) Ist der Trade im Kontext berechtigt oder auffaellig?
3) Gibt es legislative oder regulatorische Zusammenhaenge?
4) Kurze Einschaetzung: Bullish/Bearish/Neutral mit Begruendung.

Antworte auf Deutsch, kurz und praegnant.`;
}
