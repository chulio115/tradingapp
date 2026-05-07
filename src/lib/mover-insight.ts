import type { HistoricalPrice, MoverInsight, NewsItem, StockQuote, EODHDSentiment } from "@/types";

const CATALYST_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "Earnings / Guidance", pattern: /earnings|revenue|eps|guidance|quarter|results|forecast/i },
  { label: "Analyst Rating", pattern: /upgrade|downgrade|price target|analyst|initiated|rating/i },
  { label: "FDA / Clinical", pattern: /fda|clinical|trial|phase\s?(1|2|3)|drug|therapy|biotech|approval/i },
  { label: "M&A / Strategic Deal", pattern: /acquisition|merger|takeover|deal|partnership|strategic|buyout/i },
  { label: "Offering / Dilution", pattern: /offering|registered direct|warrant|dilution|atm program|public offering/i },
  { label: "Legal / Regulatory", pattern: /lawsuit|sec|investigation|regulatory|compliance|probe|settlement/i },
  { label: "Contract / Order", pattern: /contract|order|award|customer|supply agreement|purchase order/i },
  { label: "Crypto / Commodity Link", pattern: /bitcoin|crypto|ethereum|gold|oil|lithium|uranium|commodity/i },
];

export function buildMoverInsight(params: {
  ticker: string;
  quote: StockQuote | null;
  news: NewsItem[];
  historicalPrices: HistoricalPrice[];
  sentiment: EODHDSentiment | null;
}): MoverInsight | null {
  const { quote, news, historicalPrices, sentiment } = params;
  if (!quote) return null;

  const changeAbs = Math.abs(quote.changesPercentage);
  const volumeSpike = calculateVolumeSpike(quote, historicalPrices);
  const catalysts = detectCatalysts(news);
  const riskFlags = detectRiskFlags(news, quote, volumeSpike);
  const sentimentBoost = sentiment ? Math.min(Math.abs(sentiment.avgSentiment) * 20, 15) : 0;
  const catalystBoost = catalysts.length ? Math.min(catalysts.length * 12, 30) : 0;
  const moveScore = Math.min(
    100,
    Math.round(changeAbs * 2.2 + Math.max(volumeSpike - 1, 0) * 12 + catalystBoost + sentimentBoost)
  );

  const direction = quote.changesPercentage > 1 ? "bullish" : quote.changesPercentage < -1 ? "bearish" : "neutral";
  const signal = classifySignal(moveScore, catalysts, riskFlags, changeAbs);
  const label = signal === "watch" ? "Watchlist Signal" : signal === "caution" ? "Nur mit Vorsicht" : "Wahrscheinlich Noise";
  const catalystText = catalysts.length ? catalysts.slice(0, 2).join(" + ") : "kein klarer kostenloser News-Katalysator";
  const summary = `${quote.symbol} bewegt sich heute ${quote.changesPercentage >= 0 ? "nach oben" : "nach unten"} (${quote.changesPercentage.toFixed(2)}%). Wahrscheinlicher Kontext: ${catalystText}. Volumenfaktor ca. ${volumeSpike.toFixed(1)}x vs. 30-Tage-Schnitt.`;

  return {
    signal,
    direction,
    score: moveScore,
    label,
    summary,
    likelyCatalysts: catalysts.length ? catalysts : ["Kein klarer Katalysator in kostenlosen News gefunden"],
    riskFlags,
    actionHint: buildActionHint(signal, direction, riskFlags),
  };
}

function calculateVolumeSpike(quote: StockQuote, prices: HistoricalPrice[]): number {
  const recentVolumes = prices
    .slice(-30)
    .map((p) => p.volume)
    .filter((v) => Number.isFinite(v) && v > 0);

  if (!quote.volume || recentVolumes.length < 5) return 1;

  const avgVolume = recentVolumes.reduce((sum, value) => sum + value, 0) / recentVolumes.length;
  return avgVolume > 0 ? quote.volume / avgVolume : 1;
}

function detectCatalysts(news: NewsItem[]): string[] {
  const found = new Set<string>();
  for (const item of news.slice(0, 10)) {
    const text = `${item.title} ${item.summary ?? ""}`;
    for (const catalyst of CATALYST_PATTERNS) {
      if (catalyst.pattern.test(text)) found.add(catalyst.label);
    }
  }
  return [...found];
}

function detectRiskFlags(news: NewsItem[], quote: StockQuote, volumeSpike: number): string[] {
  const flags = new Set<string>();
  const text = news.map((n) => `${n.title} ${n.summary ?? ""}`).join(" \n ");

  if (/offering|dilution|warrant|reverse split|bankruptcy|delisting/i.test(text)) {
    flags.add("Dilution/Distress Risiko in News erkennbar");
  }
  if (Math.abs(quote.changesPercentage) > 25 && news.length === 0) {
    flags.add("Sehr starke Bewegung ohne klaren News-Katalysator");
  }
  if (volumeSpike > 5) {
    flags.add("Extremer Volume Spike — hohe Intraday-Volatilitaet moeglich");
  }
  if (quote.price < 2) {
    flags.add("Low-priced Stock — erhoehtes Pump/Dump Risiko");
  }

  return [...flags];
}

function classifySignal(
  score: number,
  catalysts: string[],
  riskFlags: string[],
  changeAbs: number
): MoverInsight["signal"] {
  const hasMajorRisk = riskFlags.some((flag) => /Dilution|Distress|Pump/i.test(flag));
  if (hasMajorRisk) return "caution";
  if (score >= 60 && catalysts.length > 0) return "watch";
  if (changeAbs >= 15 && catalysts.length === 0) return "caution";
  if (score >= 45) return "caution";
  return "noise";
}

function buildActionHint(
  signal: MoverInsight["signal"],
  direction: MoverInsight["direction"],
  riskFlags: string[]
): string {
  if (signal === "watch") {
    return direction === "bullish"
      ? "Auf Watchlist: Katalysator + Momentum vorhanden. Nicht blind kaufen, sondern News bestaetigen und Intraday-Level beobachten."
      : "Auf Watchlist: bearischer Katalysator moeglich. Erst bestaetigen, ob es struktureller Abverkauf oder Ueberreaktion ist.";
  }
  if (signal === "caution") {
    return riskFlags.length
      ? "Vorsicht: Bewegung kann tradebar sein, aber Risiko-Flags zuerst pruefen. Position sizing klein halten oder nur beobachten."
      : "Vorsicht: Bewegung ist gross, aber Signalqualitaet noch unklar. Erst Catalyst/Volume bestaetigen.";
  }
  return "Kein klares Signal: wahrscheinlich normales Hin und Her oder zu wenig Kontext. Nur beobachten.";
}
