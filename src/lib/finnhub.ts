import type { InsiderSentiment, SocialSentiment, NewsItem } from "@/types";
import { format, subDays } from "date-fns";

const BASE_URL = "https://finnhub.io/api/v1";

function getApiKey(): string {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY is not set");
  return key;
}

async function finnhubFetch<T>(path: string): Promise<T> {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${BASE_URL}${path}${separator}token=${getApiKey()}`;

  const res = await fetch(url, { next: { revalidate: 0 } });

  if (!res.ok) {
    throw new Error(
      `Finnhub API error: ${res.status} ${res.statusText} for ${path}`
    );
  }

  return res.json() as Promise<T>;
}

export async function getCompanyNews(
  symbol: string,
  daysBack: number = 7
): Promise<NewsItem[]> {
  try {
    const to = format(new Date(), "yyyy-MM-dd");
    const from = format(subDays(new Date(), daysBack), "yyyy-MM-dd");

    const data = await finnhubFetch<
      Array<{
        id: number;
        headline: string;
        url: string;
        source: string;
        datetime: number;
        summary: string;
      }>
    >(`/company-news?symbol=${symbol}&from=${from}&to=${to}`);

    return (data ?? []).slice(0, 10).map((item) => ({
      id: `finnhub-${item.id}`,
      ticker: symbol,
      title: item.headline,
      url: item.url,
      source: item.source,
      publishedAt: new Date(item.datetime * 1000).toISOString(),
      summary: item.summary?.slice(0, 300) ?? null,
      sentiment: null,
    }));
  } catch (error) {
    console.error(`Finnhub: Failed to fetch news for ${symbol}:`, error);
    return [];
  }
}

export async function getInsiderSentiment(
  symbol: string
): Promise<InsiderSentiment | null> {
  try {
    const to = format(new Date(), "yyyy-MM-dd");
    const from = format(subDays(new Date(), 90), "yyyy-MM-dd");

    const data = await finnhubFetch<{
      symbol: string;
      data: Array<{
        symbol: string;
        year: number;
        month: number;
        change: number;
        mspr: number;
      }>;
    }>(`/stock/insider-sentiment?symbol=${symbol}&from=${from}&to=${to}`);

    if (!data?.data?.length) return null;

    const latest = data.data[data.data.length - 1];
    const totalPositive = data.data
      .filter((d) => d.change > 0)
      .reduce((sum, d) => sum + d.change, 0);
    const totalNegative = data.data
      .filter((d) => d.change < 0)
      .reduce((sum, d) => sum + d.change, 0);

    return {
      symbol,
      mspr: latest.mspr,
      msprChange: latest.change,
      positiveChange: totalPositive,
      negativeChange: Math.abs(totalNegative),
    };
  } catch (error) {
    console.error(
      `Finnhub: Failed to fetch insider sentiment for ${symbol}:`,
      error
    );
    return null;
  }
}

export async function getSocialSentiment(
  symbol: string
): Promise<SocialSentiment | null> {
  try {
    const to = format(new Date(), "yyyy-MM-dd");
    const from = format(subDays(new Date(), 7), "yyyy-MM-dd");

    const data = await finnhubFetch<{
      symbol: string;
      reddit: Array<{
        mention: number;
        positiveMention: number;
        negativeMention: number;
      }>;
      twitter: Array<{
        mention: number;
        positiveMention: number;
        negativeMention: number;
      }>;
    }>(`/stock/social-sentiment?symbol=${symbol}&from=${from}&to=${to}`);

    const redditTotal = (data?.reddit ?? []).reduce(
      (acc, r) => ({
        mentions: acc.mentions + r.mention,
        positive: acc.positive + r.positiveMention,
        negative: acc.negative + r.negativeMention,
      }),
      { mentions: 0, positive: 0, negative: 0 }
    );

    const twitterTotal = (data?.twitter ?? []).reduce(
      (acc, t) => ({
        mentions: acc.mentions + t.mention,
        positive: acc.positive + t.positiveMention,
        negative: acc.negative + t.negativeMention,
      }),
      { mentions: 0, positive: 0, negative: 0 }
    );

    return {
      symbol,
      redditMentions: redditTotal.mentions,
      twitterMentions: twitterTotal.mentions,
      redditPositiveMention: redditTotal.positive,
      redditNegativeMention: redditTotal.negative,
      twitterPositiveMention: twitterTotal.positive,
      twitterNegativeMention: twitterTotal.negative,
    };
  } catch (error) {
    console.error(
      `Finnhub: Failed to fetch social sentiment for ${symbol}:`,
      error
    );
    return null;
  }
}

export async function getQuote(
  symbol: string
): Promise<{ c: number; d: number; dp: number; h: number; l: number; o: number; pc: number } | null> {
  try {
    return await finnhubFetch(`/quote?symbol=${symbol}`);
  } catch (error) {
    console.error(`Finnhub: Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}
