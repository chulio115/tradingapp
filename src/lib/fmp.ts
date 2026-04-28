// Re-exports from Yahoo Finance — replaces all FMP Legacy endpoints
// This file exists so that existing imports from "@/lib/fmp" keep working.
export {
  getCompanyProfile,
  getStockQuote,
  getHistoricalPrices,
  getCompanyNews,
} from "./yahoo";
