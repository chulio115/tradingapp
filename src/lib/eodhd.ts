import type { NewsItem, EODHDSentiment } from "@/types";
import { format, subDays } from "date-fns";

const BASE_URL = "https://eodhd.com/api";

function getApiKey(): string {
  const key = process.env.EODHD_API_KEY;
  if (!key) throw new Error("EODHD_API_KEY is not set");
  return key;
}

async function eodhdFetch<T>(path: string): Promise<T> {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${BASE_URL}${path}${separator}api_token=${getApiKey()}&fmt=json`;

  const res = await fetch(url, { next: { revalidate: 0 } });

  if (!res.ok) {
    throw new Error(
      `EODHD API error: ${res.status} ${res.statusText} for ${path}`
    );
  }

  return res.json() as Promise<T>;
}

export async function getCompanyNews(
  symbol: string,
  limit: number = 10
): Promise<NewsItem[]> {
  try {
    const data = await eodhdFetch<
      Array<{
        date: string;
        title: string;
        content: string;
        link: string;
        symbols: string[];
        tags: string[];
        sentiment?: {
          polarity: number;
          neg: number;
          neu: number;
          pos: number;
        };
      }>
    >(`/news?s=${symbol}.US&offset=0&limit=${limit}`);

    return (data ?? []).map((item, i) => ({
      id: `eodhd-${symbol}-${i}`,
      ticker: symbol,
      title: item.title,
      url: item.link,
      source: null,
      publishedAt: item.date,
      summary: item.content?.slice(0, 300) ?? null,
      sentiment: item.sentiment?.polarity ?? null,
    }));
  } catch (error) {
    console.error(`EODHD: Failed to fetch news for ${symbol}:`, error);
    return [];
  }
}

export async function getSentiment(
  symbol: string,
  daysBack: number = 30
): Promise<EODHDSentiment | null> {
  try {
    const to = format(new Date(), "yyyy-MM-dd");
    const from = format(subDays(new Date(), daysBack), "yyyy-MM-dd");

    const data = await eodhdFetch<
      Record<
        string,
        Array<{
          date: string;
          count: number;
          normalized: number;
        }>
      >
    >(`/sentiments?s=${symbol}.US&from=${from}&to=${to}`);

    const entries = data?.[`${symbol}.US`] ?? data?.[symbol] ?? [];

    if (!entries.length) return null;

    const totalCount = entries.reduce((sum, e) => sum + e.count, 0);
    const avgSentiment =
      entries.reduce((sum, e) => sum + e.normalized, 0) / entries.length;

    const latest = entries[0];

    return {
      symbol,
      avgSentiment,
      latestSentiment: latest.normalized,
      latestDate: latest.date,
      totalMentions: totalCount,
      dataPoints: entries.length,
    };
  } catch (error) {
    console.error(
      `EODHD: Failed to fetch sentiment for ${symbol}:`,
      error
    );
    return null;
  }
}
