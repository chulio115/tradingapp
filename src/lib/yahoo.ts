import type { StockQuote, CompanyProfile, HistoricalPrice, NewsItem } from "@/types";

const CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const TRENDING_BASE = "https://query1.finance.yahoo.com/v1/finance/trending/US";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; CongressTracker/1.0)",
};

interface YahooChartMeta {
  symbol: string;
  currency: string;
  regularMarketPrice: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  chartPreviousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  longName?: string;
  shortName?: string;
  fullExchangeName?: string;
}

interface YahooChartResult {
  meta: YahooChartMeta;
  timestamp: number[];
  indicators: {
    quote: Array<{
      open: number[];
      high: number[];
      low: number[];
      close: number[];
      volume: number[];
    }>;
  };
}

async function yahooFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Yahoo Finance error: ${res.status} for ${url}`);
  }
  return res.json() as Promise<T>;
}

export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const data = await yahooFetch<{ chart: { result: YahooChartResult[] } }>(
      `${CHART_BASE}/${symbol}?range=1d&interval=1d`
    );

    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const prevClose = meta.chartPreviousClose || meta.regularMarketPrice;
    const change = meta.regularMarketPrice - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;

    return {
      symbol: meta.symbol,
      name: meta.longName || meta.shortName || symbol,
      price: meta.regularMarketPrice,
      changesPercentage: changePercent,
      change,
      dayLow: meta.regularMarketDayLow,
      dayHigh: meta.regularMarketDayHigh,
      yearHigh: meta.fiftyTwoWeekHigh,
      yearLow: meta.fiftyTwoWeekLow,
      marketCap: 0,
      volume: meta.regularMarketVolume,
      avgVolume: 0,
      open: meta.regularMarketDayLow,
      previousClose: prevClose,
      timestamp: Math.floor(Date.now() / 1000),
    };
  } catch (error) {
    console.error(`Yahoo: Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  try {
    const data = await yahooFetch<{ chart: { result: YahooChartResult[] } }>(
      `${CHART_BASE}/${symbol}?range=1d&interval=1d`
    );

    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    return {
      symbol: meta.symbol,
      companyName: meta.longName || meta.shortName || symbol,
      sector: "",
      industry: "",
      mktCap: 0,
      description: "",
      website: "",
      image: "",
      exchange: meta.fullExchangeName || "",
      ceo: "",
      country: "US",
      fullTimeEmployees: "",
    };
  } catch (error) {
    console.error(`Yahoo: Failed to fetch profile for ${symbol}:`, error);
    return null;
  }
}

export async function getHistoricalPrices(
  symbol: string,
  days: number = 30
): Promise<HistoricalPrice[]> {
  try {
    const data = await yahooFetch<{ chart: { result: YahooChartResult[] } }>(
      `${CHART_BASE}/${symbol}?range=${days}d&interval=1d`
    );

    const result = data?.chart?.result?.[0];
    if (!result?.timestamp || !result?.indicators?.quote?.[0]) return [];

    const quote = result.indicators.quote[0];

    return result.timestamp.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split("T")[0],
      open: quote.open[i] ?? 0,
      high: quote.high[i] ?? 0,
      low: quote.low[i] ?? 0,
      close: quote.close[i] ?? 0,
      volume: quote.volume[i] ?? 0,
    }));
  } catch (error) {
    console.error(`Yahoo: Failed to fetch historical prices for ${symbol}:`, error);
    return [];
  }
}

export interface YahooMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export async function getTrendingStocks(): Promise<YahooMover[]> {
  try {
    const data = await yahooFetch<{
      finance: { result: Array<{ quotes: Array<{ symbol: string }> }> };
    }>(TRENDING_BASE);

    const symbols = data?.finance?.result?.[0]?.quotes?.map((q) => q.symbol) ?? [];
    if (!symbols.length) return [];

    const top = symbols.slice(0, 20);
    const movers: YahooMover[] = [];

    // Fetch quotes in batches of 5 to avoid rate limiting
    for (let i = 0; i < top.length; i += 5) {
      const batch = top.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map((s) => getStockQuote(s))
      );

      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          const q = r.value;
          movers.push({
            symbol: q.symbol,
            name: q.name,
            price: q.price,
            change: q.change,
            changePercent: q.changesPercentage,
            volume: q.volume,
          });
        }
      }

      // Small delay between batches
      if (i + 5 < top.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return movers;
  } catch (error) {
    console.error("Yahoo: Failed to fetch trending stocks:", error);
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getCompanyNews(_symbol: string, _limit = 5): Promise<NewsItem[]> {
  // Yahoo Finance news requires a different endpoint that may be rate-limited
  // We rely on EODHD for news instead
  return [];
}
