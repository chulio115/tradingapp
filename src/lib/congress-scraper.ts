import type { CongressTrade } from "@/types";
import { format, subDays } from "date-fns";

// Alternative Congressional Trading Sources
const CONGRESS_SOURCES = {
  // Senate Stock Watcher (unofficial but reliable)
  senateStockWatcher: "https://senatestockwatcher.com/api/senate/trades",
  
  // House Stock Watcher (unofficial but reliable)
  houseStockWatcher: "https://housestockwatcher.com/api/house/trades",
  
  // Public Disclosures (official but harder to parse)
  publicDisclosures: "https://disclosures-clerk.house.gov/public_disc",
};

interface SenateTradeResponse {
  id: string;
  senator: string;
  party: string;
  state: string;
  ticker: string;
  asset_description: string;
  transaction_type: string;
  amount: string;
  transaction_date: string;
  disclosure_date: string;
}

interface HouseTradeResponse {
  id: string;
  representative: string;
  party: string;
  district: string;
  ticker: string;
  asset_description: string;
  transaction_type: string;
  amount: string;
  transaction_date: string;
  disclosure_date: string;
}

async function fetchWithRetry(url: string, retries = 3): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CongressTracker/1.0)",
        },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed for ${url}:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}

export async function fetchSenateTrades(daysBack = 30): Promise<CongressTrade[]> {
  try {
    const data = await fetchWithRetry(CONGRESS_SOURCES.senateStockWatcher);
    
    if (!Array.isArray(data)) {
      console.warn("Senate Stock Watcher returned unexpected format");
      return [];
    }

    const cutoffDate = subDays(new Date(), daysBack);
    
    return data
      .filter((trade: SenateTradeResponse) => {
        const tradeDate = new Date(trade.transaction_date);
        return tradeDate >= cutoffDate && trade.ticker && trade.ticker.length <= 5;
      })
      .map((trade: SenateTradeResponse) => ({
        id: `senate-${trade.id}`,
        chamber: "senate" as const,
        politician: trade.senator,
        party: trade.party || "Unknown",
        state: trade.state || null,
        ticker: trade.ticker.toUpperCase(),
        companyName: trade.asset_description || null,
        transactionType: trade.transaction_type || "Unknown",
        amount: trade.amount || "Unknown",
        transactionDate: trade.transaction_date,
        filingDate: trade.disclosure_date || trade.transaction_date,
        assetType: "Stock",
        createdAt: new Date().toISOString(),
      }));
  } catch (error) {
    console.error("Failed to fetch Senate trades:", error);
    return [];
  }
}

export async function fetchHouseTrades(daysBack = 30): Promise<CongressTrade[]> {
  try {
    const data = await fetchWithRetry(CONGRESS_SOURCES.houseStockWatcher);
    
    if (!Array.isArray(data)) {
      console.warn("House Stock Watcher returned unexpected format");
      return [];
    }

    const cutoffDate = subDays(new Date(), daysBack);
    
    return data
      .filter((trade: HouseTradeResponse) => {
        const tradeDate = new Date(trade.transaction_date);
        return tradeDate >= cutoffDate && trade.ticker && trade.ticker.length <= 5;
      })
      .map((trade: HouseTradeResponse) => ({
        id: `house-${trade.id}`,
        chamber: "house" as const,
        politician: trade.representative,
        party: trade.party || "Unknown",
        state: null, // House API doesn't always provide state
        ticker: trade.ticker.toUpperCase(),
        companyName: trade.asset_description || null,
        transactionType: trade.transaction_type || "Unknown",
        amount: trade.amount || "Unknown",
        transactionDate: trade.transaction_date,
        filingDate: trade.disclosure_date || trade.transaction_date,
        assetType: "Stock",
        createdAt: new Date().toISOString(),
      }));
  } catch (error) {
    console.error("Failed to fetch House trades:", error);
    return [];
  }
}

export async function fetchAllCongressTrades(daysBack = 30): Promise<CongressTrade[]> {
  const [senateTrades, houseTrades] = await Promise.allSettled([
    fetchSenateTrades(daysBack),
    fetchHouseTrades(daysBack),
  ]);

  const allTrades = [
    ...(senateTrades.status === "fulfilled" ? senateTrades.value : []),
    ...(houseTrades.status === "fulfilled" ? houseTrades.value : []),
  ];

  // Sort by filing date (newest first)
  return allTrades.sort((a, b) => 
    new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime()
  );
}

// Fallback: Create sample trades if APIs fail (for testing only)
export function createSampleTrades(): CongressTrade[] {
  const today = new Date();
  const sampleTrades: CongressTrade[] = [
    {
      id: "sample-senate-1",
      chamber: "senate",
      politician: "Sample Senator",
      party: "D",
      state: "CA",
      ticker: "NVDA",
      companyName: "NVIDIA Corporation",
      transactionType: "Purchase",
      amount: "$1,001 - $15,000",
      transactionDate: format(subDays(today, 5), "yyyy-MM-dd"),
      filingDate: format(subDays(today, 2), "yyyy-MM-dd"),
      assetType: "Stock",
      createdAt: today.toISOString(),
    },
    {
      id: "sample-house-1",
      chamber: "house",
      politician: "Sample Representative",
      party: "R",
      state: "TX",
      ticker: "AAPL",
      companyName: "Apple Inc.",
      transactionType: "Sale",
      amount: "$15,001 - $50,000",
      transactionDate: format(subDays(today, 3), "yyyy-MM-dd"),
      filingDate: format(subDays(today, 1), "yyyy-MM-dd"),
      assetType: "Stock",
      createdAt: today.toISOString(),
    },
  ];

  return sampleTrades;
}
