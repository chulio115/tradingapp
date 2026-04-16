"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import TradeTable from "@/components/TradeTable";
import type { CongressTrade } from "@/types";

export default function CongressPage() {
  const [trades, setTrades] = useState<CongressTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    chamber: "",
    party: "",
    ticker: "",
  });

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (filters.chamber) params.set("chamber", filters.chamber);
      if (filters.party) params.set("party", filters.party);
      if (filters.ticker) params.set("ticker", filters.ticker);

      const res = await fetch(`/api/trades?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTrades(data.trades);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch trades:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const chamberOptions = ["", "senate", "house"];
  const partyOptions = ["", "D", "R", "I"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Congressional Trades
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} Trades in der Datenbank
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTrades}
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Aktualisieren
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
        </div>

        <div className="flex gap-1.5">
          {chamberOptions.map((c) => (
            <Button
              key={c || "all-chamber"}
              variant={filters.chamber === c ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilters({ ...filters, chamber: c });
                setPage(1);
              }}
            >
              {c === "" ? "Alle" : c === "senate" ? "Senate" : "House"}
            </Button>
          ))}
        </div>

        <div className="flex gap-1.5">
          {partyOptions.map((p) => (
            <Button
              key={p || "all-party"}
              variant={filters.party === p ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilters({ ...filters, party: p });
                setPage(1);
              }}
            >
              {p === "" ? "Alle" : p}
              {p === "D" && (
                <Badge className="ml-1 bg-blue-500/20 text-blue-500 text-[10px]">
                  Dem
                </Badge>
              )}
              {p === "R" && (
                <Badge className="ml-1 bg-red-500/20 text-red-500 text-[10px]">
                  Rep
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ticker suchen..."
            className="pl-9"
            value={filters.ticker}
            onChange={(e) => {
              setFilters({ ...filters, ticker: e.target.value });
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <TradeTable trades={trades} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Seite {page} von {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Zurueck
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Weiter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
