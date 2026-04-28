"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, FileText, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import TradeTable from "@/components/TradeTable";
import type { CongressTrade } from "@/types";

export default function CongressPage() {
  const [trades, setTrades] = useState<CongressTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });

      const res = await fetch(`/api/trades?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      // Client-side search filter by politician name
      const filtered = search
        ? (data.trades as CongressTrade[]).filter((t: CongressTrade) =>
            t.politician.toLowerCase().includes(search.toLowerCase())
          )
        : data.trades;
      setTrades(filtered);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch trades:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Financial Disclosures
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} Periodic Transaction Reports (House)
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

      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Daten stammen vom offiziellen <strong>House Clerk</strong>. Jeder Eintrag ist ein Periodic Transaction Report (PTR).
          Klicke auf &quot;PDF&quot; um die vollständigen Transaktionsdetails (Ticker, Beträge) einzusehen.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Politiker suchen..."
          className="pl-9"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
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
