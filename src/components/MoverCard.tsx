"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MiniChart from "./MiniChart";
import ResearchCard from "./ResearchCard";
import type { MarketMover, HistoricalPrice } from "@/types";

interface MoverCardProps {
  mover: MarketMover;
}

export default function MoverCard({ mover }: MoverCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [historicalPrices, setHistoricalPrices] = useState<HistoricalPrice[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);

  const isGainer = mover.type === "gainer";
  const colorClass = isGainer ? "text-emerald-500" : "text-red-500";
  const bgClass = isGainer
    ? "hover:border-emerald-500/30"
    : "hover:border-red-500/30";

  // Fetch historical prices for sparkline when card is visible
  useEffect(() => {
    const fetchHistorical = async () => {
      setLoadingChart(true);
      try {
        const res = await fetch(`/api/research/${mover.ticker}`);
        if (res.ok) {
          const data = await res.json();
          setHistoricalPrices(data.historicalPrices ?? []);
        }
      } catch {
        // Silent fail for sparkline
      } finally {
        setLoadingChart(false);
      }
    };
    fetchHistorical();
  }, [mover.ticker]);

  return (
    <Card
      className={`cursor-pointer transition-all ${bgClass}`}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left side: ticker, price, company */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`p-2 rounded-lg shrink-0 ${isGainer ? "bg-emerald-500/10" : "bg-red-500/10"}`}
            >
              {isGainer ? (
                <TrendingUp className={`h-4 w-4 ${colorClass}`} />
              ) : (
                <TrendingDown className={`h-4 w-4 ${colorClass}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm">
                  {mover.ticker}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] font-mono ${isGainer ? "text-emerald-500" : "text-red-500"}`}
                >
                  ${mover.price.toFixed(2)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {mover.companyName}
              </p>
            </div>
          </div>

          {/* Right side: change % + sparkline */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mini sparkline */}
            {historicalPrices.length > 0 && !loadingChart && (
              <div className="w-20 h-8">
                <MiniChart
                  data={historicalPrices.slice(-7)}
                  currentPrice={mover.price}
                  height={32}
                  color={isGainer ? "#10b981" : "#ef4444"}
                />
              </div>
            )}

            <div className="text-right">
              <p className={`font-bold text-sm ${colorClass}`}>
                {isGainer ? "+" : ""}
                {mover.changePercent.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {isGainer ? "+" : ""}
                {mover.change.toFixed(2)}
              </p>
            </div>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {mover.volume && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Vol: {(Number(mover.volume) / 1e6).toFixed(1)}M
          </p>
        )}

        {expanded && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <ResearchCard ticker={mover.ticker} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
