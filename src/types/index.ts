export interface CongressTrade {
  id: string;
  chamber: "senate" | "house";
  politician: string;
  party: string;
  state: string | null;
  ticker: string;
  companyName: string | null;
  transactionType: string;
  amount: string;
  transactionDate: string;
  filingDate: string;
  assetType: string | null;
  createdAt: string;
}

export interface CongressFiling {
  politician: string;
  chamber: "house";
  state: string | null;
  filingType: string;
  filingDate: string;
  year: number;
  docId: string;
  pdfUrl: string;
}

export interface MarketMover {
  id: string;
  date: string;
  ticker: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number | null;
  type: "gainer" | "loser";
  createdAt: string;
}

export interface NewsItem {
  id: string;
  ticker: string;
  title: string;
  url: string;
  source: string | null;
  publishedAt: string;
  summary: string | null;
  sentiment: number | null;
}

export interface AlertRule {
  id: string;
  name: string;
  type: "congress_trade" | "market_mover" | "ticker_watch";
  conditions: string;
  channel: "telegram" | "email";
  active: boolean;
  createdAt: string;
}

export interface AlertLog {
  id: string;
  ruleId: string;
  message: string;
  sentAt: string;
  success: boolean;
}

export interface CompanyProfile {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  mktCap: number;
  description: string;
  website: string;
  image: string;
  exchange: string;
  ceo: string;
  country: string;
  fullTimeEmployees: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ResearchCardData {
  profile: CompanyProfile | null;
  quote: StockQuote | null;
  news: NewsItem[];
  historicalPrices: HistoricalPrice[];
  sentiment: EODHDSentiment | null;
  congressTrades: CongressTrade[];
  aiAnalysis?: string;
}

export interface EODHDSentiment {
  symbol: string;
  avgSentiment: number;
  latestSentiment: number;
  latestDate: string;
  totalMentions: number;
  dataPoints: number;
}

export interface CongressTradeConditions {
  minAmount?: string;
  transactionType?: string;
  politicians?: string[];
  tickers?: string[];
}

export interface MarketMoverConditions {
  minChangePercent?: number;
  direction?: "up" | "down" | "both";
}

export interface TickerWatchConditions {
  tickers: string[];
}

