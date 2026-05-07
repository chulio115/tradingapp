"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import MoverCard from "@/components/MoverCard";
import AuthWrapper from "@/components/AuthWrapper";
import type { MarketMover } from "@/types";

interface MoversResponse {
  movers: MarketMover[];
  asOf: string | null;
  isStale: boolean;
  staleThresholdHours: number;
}

function MoversPageContent() {
  const [gainers, setGainers] = useState<MarketMover[]>([]);
  const [losers, setLosers] = useState<MarketMover[]>([]);
  const [loading, setLoading] = useState(true);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  const fetchMovers = async () => {
    setLoading(true);
    try {
      const [gainersRes, losersRes] = await Promise.all([
        fetch("/api/movers?type=gainer"),
        fetch("/api/movers?type=loser"),
      ]);

      if (gainersRes.ok) {
        const data = (await gainersRes.json()) as MoversResponse;
        setGainers(data.movers);
        setAsOf(data.asOf);
        setIsStale(data.isStale);
      }
      if (losersRes.ok) {
        const data = (await losersRes.json()) as MoversResponse;
        setLosers(data.movers);
        setAsOf((current) => current ?? data.asOf);
        setIsStale((current) => current || data.isStale);
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
          {asOf && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Datenstand: {new Date(asOf).toLocaleString("de-DE")}
              </span>
            </div>
          )}
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

      {isStale && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Market-Mover-Daten sind wahrscheinlich veraltet.</p>
            <p className="mt-1 text-amber-200/80">
              Der automatische Cron sollte neue Werte laden. Wenn diese Warnung bleibt,
              pruefen wir GitHub Actions/CRON_SECRET.
            </p>
          </div>
        </div>
      )}

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

export default function MoversPage() {
  return (
    <AuthWrapper>
      <MoversPageContent />
    </AuthWrapper>
  );
}
