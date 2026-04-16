import type {
  FMPSenateTrade,
  FMPHouseTrade,
  FMPMover,
  CompanyProfile,
  StockQuote,
  HistoricalPrice,
  NewsItem,
} from "@/types";

const BASE_URL = "https://financialmodelingprep.com";

function getApiKey(): string {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error("FMP_API_KEY is not set");
  return key;
}

async function fmpFetch<T>(path: string): Promise<T> {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${BASE_URL}${path}${separator}apikey=${getApiKey()}`;

  const res = await fetch(url, { next: { revalidate: 0 } });

  if (!res.ok) {
    throw new Error(`FMP API error: ${res.status} ${res.statusText} for ${path}`);
  }

  return res.json() as Promise<T>;
}

export async function getSenateTrades(): Promise<FMPSenateTrade[]> {
  try {
    return await fmpFetch<FMPSenateTrade[]>("/api/v4/senate-trading");
  } catch (error) {
    console.error("Failed to fetch senate trades:", error);
    return [];
  }
}

export async function getHouseTrades(): Promise<FMPHouseTrade[]> {
  try {
    return await fmpFetch<FMPHouseTrade[]>("/api/v4/house-disclosure");
  } catch (error) {
    console.error("Failed to fetch house trades:", error);
    return [];
  }
}

export async function getBiggestGainers(): Promise<FMPMover[]> {
  try {
    return await fmpFetch<FMPMover[]>("/api/v3/stock_market/gainers");
  } catch (error) {
    console.error("Failed to fetch gainers:", error);
    return [];
  }
}

export async function getBiggestLosers(): Promise<FMPMover[]> {
  try {
    return await fmpFetch<FMPMover[]>("/api/v3/stock_market/losers");
  } catch (error) {
    console.error("Failed to fetch losers:", error);
    return [];
  }
}

export async function getCompanyProfile(
  symbol: string
): Promise<CompanyProfile | null> {
  try {
    const data = await fmpFetch<CompanyProfile[]>(`/api/v3/profile/${symbol}`);
    return data?.[0] ?? null;
  } catch (error) {
    console.error(`Failed to fetch profile for ${symbol}:`, error);
    return null;
  }
}

export async function getStockQuote(
  symbol: string
): Promise<StockQuote | null> {
  try {
    const data = await fmpFetch<StockQuote[]>(`/api/v3/quote/${symbol}`);
    return data?.[0] ?? null;
  } catch (error) {
    console.error(`Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}

export async function getHistoricalPrices(
  symbol: string,
  days: number = 30
): Promise<HistoricalPrice[]> {
  try {
    const data = await fmpFetch<{ historical: HistoricalPrice[] }>(
      `/api/v3/historical-price-full/${symbol}?timeseries=${days}`
    );
    return data?.historical ?? [];
  } catch (error) {
    console.error(`Failed to fetch historical prices for ${symbol}:`, error);
    return [];
  }
}

export async function getCompanyNews(
  symbol: string,
  limit: number = 5
): Promise<NewsItem[]> {
  try {
    const data = await fmpFetch<
      Array<{
        symbol: string;
        title: string;
        url: string;
        site: string;
        publishedDate: string;
        text: string;
      }>
    >(`/api/v3/stock_news?tickers=${symbol}&limit=${limit}`);

    return data.map((item) => ({
      id: `fmp-${item.url}`,
      ticker: symbol,
      title: item.title,
      url: item.url,
      source: item.site,
      publishedAt: item.publishedDate,
      summary: item.text?.slice(0, 300) ?? null,
      sentiment: null,
    }));
  } catch (error) {
    console.error(`Failed to fetch news for ${symbol}:`, error);
    return [];
  }
}
