"use client";

import { useState } from "react";
import {
  ExternalLink,
  TrendingUp,
  Brain,
  Loader2,
  Newspaper,
  MessageCircle,
  Landmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import MiniChart from "./MiniChart";
import type { ResearchCardData } from "@/types";

interface ResearchCardProps {
  ticker: string;
  tradeContext?: string;
}

export default function ResearchCard({ ticker, tradeContext }: ResearchCardProps) {
  const [data, setData] = useState<ResearchCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const loadResearch = async () => {
    if (data) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/research/${ticker}`);
      if (!res.ok) throw new Error("Failed to fetch research data");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const loadAIAnalysis = async () => {
    if (!data) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, tradeContext }),
      });
      if (!res.ok) throw new Error("AI analysis failed");
      const result = await res.json();
      setAiAnalysis(result.analysis);
    } catch (err) {
      setAiAnalysis(
        err instanceof Error ? err.message : "AI-Analyse fehlgeschlagen"
      );
    } finally {
      setAiLoading(false);
    }
  };

  if (!data && !loading) {
    return (
      <Button variant="outline" size="sm" onClick={loadResearch}>
        Research laden
      </Button>
    );
  }

  if (loading) {
    return (
      <Card className="mt-3">
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-3 border-destructive">
        <CardContent className="p-4 text-sm text-destructive">
          Fehler: {error}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="mt-3">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Research: {ticker}
          </CardTitle>
          {data.profile && (
            <Badge variant="secondary" className="text-xs">
              {data.profile.sector}
            </Badge>
          )}
        </div>
        {data.profile && (
          <p className="text-xs text-muted-foreground mt-1">
            {data.profile.companyName} · {data.profile.industry} ·{" "}
            MarketCap: ${(data.profile.mktCap / 1e9).toFixed(2)}B
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price Chart */}
        {data.historicalPrices.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" /> 30-Tage Kursverlauf
            </h4>
            <MiniChart data={data.historicalPrices} currentPrice={data.quote?.price} />
          </div>
        )}

        {/* Current Quote */}
        {data.quote && (
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">${data.quote.price.toFixed(2)}</span>
            <span
              className={
                data.quote.changesPercentage >= 0
                  ? "text-emerald-500"
                  : "text-red-500"
              }
            >
              {data.quote.changesPercentage >= 0 ? "+" : ""}
              {data.quote.changesPercentage.toFixed(2)}%
            </span>
            <span className="text-muted-foreground text-xs">
              Vol: {(data.quote.volume / 1e6).toFixed(1)}M
            </span>
          </div>
        )}

        {/* Sentiment (EODHD) */}
        {data.sentiment && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
              <MessageCircle className="h-3 w-3" /> Sentiment (30 Tage)
            </h4>
            <div className="flex items-center gap-3 text-sm">
              <span
                className={
                  data.sentiment.avgSentiment >= 0
                    ? "text-emerald-500"
                    : "text-red-500"
                }
              >
                {data.sentiment.avgSentiment > 0 ? "+" : ""}
                {data.sentiment.avgSentiment.toFixed(3)}
              </span>
              <span className="text-xs text-muted-foreground">
                {data.sentiment.totalMentions} Mentions · {data.sentiment.dataPoints} Tage
              </span>
            </div>
          </div>
        )}

        {/* News */}
        {data.news.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Newspaper className="h-3 w-3" /> Aktuelle News
            </h4>
            <div className="space-y-1.5">
              {data.news.slice(0, 5).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-xs hover:text-emerald-500 transition-colors group"
                >
                  <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 opacity-50 group-hover:opacity-100" />
                  <span className="line-clamp-1">{item.title}</span>
                  {item.source && (
                    <span className="text-muted-foreground shrink-0">
                      ({item.source})
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Congressional Trades Cross-Reference */}
        {data.congressTrades.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Landmark className="h-3 w-3" /> Congressional Trades ({ticker})
            </h4>
            <div className="space-y-1">
              {data.congressTrades.slice(0, 5).map((trade) => (
                <div key={trade.id} className="text-xs flex items-center gap-2">
                  <Badge
                    variant={
                      trade.transactionType.toLowerCase().includes("purchase")
                        ? "default"
                        : "destructive"
                    }
                    className="text-[10px] px-1.5"
                  >
                    {trade.transactionType}
                  </Badge>
                  <span>
                    {trade.politician} ({trade.party})
                  </span>
                  <span className="text-muted-foreground">{trade.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis */}
        <div className="pt-2 border-t border-border">
          {aiAnalysis ? (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Brain className="h-3 w-3" /> AI-Analyse
              </h4>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {aiAnalysis}
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={loadAIAnalysis}
              disabled={aiLoading}
              className="w-full"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Analyse laeuft...
                </>
              ) : (
                <>
                  <Brain className="h-3 w-3 mr-2" />
                  AI-Analyse starten
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
