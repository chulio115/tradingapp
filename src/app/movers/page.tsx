"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import MoverCard from "@/components/MoverCard";
import type { MarketMover } from "@/types";

export default function MoversPage() {
  const [gainers, setGainers] = useState<MarketMover[]>([]);
  const [losers, setLosers] = useState<MarketMover[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovers = async () => {
    setLoading(true);
    try {
      const [gainersRes, losersRes] = await Promise.all([
        fetch("/api/movers?type=gainer"),
        fetch("/api/movers?type=loser"),
      ]);

      if (gainersRes.ok) {
        const data = await gainersRes.json();
        setGainers(data.movers);
      }
      if (losersRes.ok) {
        const data = await losersRes.json();
        setLosers(data.movers);
      }
    } catch (error) {
      console.error("Failed to fetch movers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market Movers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Biggest Gainers & Losers des Tages
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMovers}
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Aktualisieren
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Gainers */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-md bg-emerald-500/10">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold">Top Gainers</h2>
            <span className="text-xs text-muted-foreground">
              ({gainers.length})
            </span>
          </div>
          <div className="space-y-3">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))
              : gainers.map((mover) => (
                  <MoverCard key={mover.id} mover={mover} />
                ))}
            {!loading && gainers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Keine Gainers vorhanden. Cron-Job ausfuehren um Daten zu laden.
              </p>
            )}
          </div>
        </div>

        {/* Losers */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-md bg-red-500/10">
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold">Top Losers</h2>
            <span className="text-xs text-muted-foreground">
              ({losers.length})
            </span>
          </div>
          <div className="space-y-3">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))
              : losers.map((mover) => (
                  <MoverCard key={mover.id} mover={mover} />
                ))}
            {!loading && losers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Keine Losers vorhanden. Cron-Job ausfuehren um Daten zu laden.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
