"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Bell,
  ArrowRight,
  Activity,
  BarChart3,
  FileText,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CongressTrade, MarketMover, AlertRule } from "@/types";

interface DashboardData {
  recentTrades: CongressTrade[];
  topGainers: MarketMover[];
  topLosers: MarketMover[];
  alertRules: AlertRule[];
  stats: {
    totalTrades: number;
    tradesThisWeek: number;
    activeAlerts: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [tradesRes, gainersRes, losersRes, alertsRes] = await Promise.all(
          [
            fetch("/api/trades?limit=5"),
            fetch("/api/movers?type=gainer"),
            fetch("/api/movers?type=loser"),
            fetch("/api/alerts"),
          ]
        );

        const tradesData = tradesRes.ok ? await tradesRes.json() : { trades: [], total: 0 };
        const gainersData = gainersRes.ok ? await gainersRes.json() : { movers: [] };
        const losersData = losersRes.ok ? await losersRes.json() : { movers: [] };
        const alertsData = alertsRes.ok ? await alertsRes.json() : [];

        setData({
          recentTrades: tradesData.trades,
          topGainers: gainersData.movers?.slice(0, 3) ?? [],
          topLosers: losersData.movers?.slice(0, 3) ?? [],
          alertRules: alertsData,
          stats: {
            totalTrades: tradesData.total,
            tradesThisWeek: tradesData.trades?.length ?? 0,
            activeAlerts: Array.isArray(alertsData)
              ? alertsData.filter((a: AlertRule) => a.active).length
              : 0,
          },
        });
      } catch (error) {
        console.error("Dashboard fetch failed:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Congressional Trades & Market Movers auf einen Blick
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Landmark className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {data?.stats.totalTrades ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Trades in der Datenbank
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(data?.topGainers.length ?? 0) +
                  (data?.topLosers.length ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Market Movers heute
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Bell className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {data?.stats.activeAlerts ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Aktive Alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              Aktuelle Filings
            </CardTitle>
            <Link href="/congress">
              <Button variant="ghost" size="sm">
                Alle anzeigen <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.recentTrades.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Noch keine Trades. Cron-Job ausfuehren um Daten zu laden.
              </p>
            )}
            {data?.recentTrades.map((trade) => {
              const pdfUrl = trade.assetType?.startsWith("http") ? trade.assetType : null;
              return (
                <div
                  key={trade.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-emerald-500/10">
                      <FileText className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{trade.politician}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {trade.state && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {trade.state}
                          </span>
                        )}
                        <span>
                          {new Date(trade.filingDate).toLocaleDateString("de-DE")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {pdfUrl && (
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1">
                      PDF <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Market Movers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Market Movers
            </CardTitle>
            <Link href="/movers">
              <Button variant="ghost" size="sm">
                Alle anzeigen <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {(data?.topGainers.length === 0 && data?.topLosers.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Noch keine Movers. Cron-Job ausfuehren um Daten zu laden.
              </p>
            )}

            {(data?.topGainers.length ?? 0) > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" /> Top
                  Gainers
                </p>
                <div className="space-y-2">
                  {data?.topGainers.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {m.ticker}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1 max-w-[150px]">
                          {m.companyName}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-emerald-500">
                        +{m.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(data?.topLosers.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-500" /> Top Losers
                </p>
                <div className="space-y-2">
                  {data?.topLosers.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {m.ticker}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1 max-w-[150px]">
                          {m.companyName}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-red-500">
                        {m.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
