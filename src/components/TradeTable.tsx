"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  ExternalLink,
  User,
  Calendar,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CongressTrade } from "@/types";

interface TradeTableProps {
  trades: CongressTrade[];
}

const partyColors: Record<string, string> = {
  D: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  R: "bg-red-500/10 text-red-500 border-red-500/20",
  I: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  Unknown: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

function extractPdfUrl(trade: CongressTrade): string | null {
  // assetType holds the PDF URL for House filings
  if (trade.assetType && trade.assetType.startsWith("http")) {
    return trade.assetType;
  }
  return null;
}

function formatDocId(ticker: string): string {
  // Strip "PTR-" prefix for display
  return ticker.replace("PTR-", "");
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wo.`;
  return `vor ${Math.floor(diffDays / 30)} Mon.`;
}

export default function TradeTable({ trades }: TradeTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (trades.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Keine Filings gefunden</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trades.map((trade) => {
        const isExpanded = expandedId === trade.id;
        const pdfUrl = extractPdfUrl(trade);
        const docId = formatDocId(trade.ticker);
        const partyClass = partyColors[trade.party] ?? partyColors.Unknown;

        return (
          <div
            key={trade.id}
            className="rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-border/80"
          >
            {/* Main row */}
            <div
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : trade.id)}
            >
              {/* Expand icon */}
              <div className="shrink-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Politician info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">
                    {trade.politician}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 ${partyClass}`}
                  >
                    {trade.party === "Unknown" ? "–" : trade.party}
                  </Badge>
                  {trade.state && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {trade.state}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span className="capitalize">{trade.chamber}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(trade.filingDate).toLocaleDateString("de-DE")}
                  </span>
                  <span className="text-[10px] opacity-70">
                    ({getTimeAgo(trade.filingDate)})
                  </span>
                </div>
              </div>

              {/* Filing type + PDF link */}
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className="text-[10px]">
                  <FileText className="h-3 w-3 mr-1" />
                  PTR
                </Badge>
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-emerald-500 hover:text-emerald-400">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="border-t border-border p-4 bg-muted/10 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">
                      <User className="h-3 w-3 inline mr-1" />Politiker
                    </span>
                    <span className="font-medium">{trade.politician}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Kammer</span>
                    <span className="font-medium capitalize">{trade.chamber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Dokument-ID</span>
                    <span className="font-mono text-emerald-500">{docId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Eingereicht</span>
                    <span>{new Date(trade.filingDate).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}</span>
                  </div>
                </div>

                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-emerald-500 hover:text-emerald-400 transition-colors bg-emerald-500/10 rounded-md px-3 py-2"
                  >
                    <FileText className="h-4 w-4" />
                    Vollständigen Bericht als PDF anzeigen
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                <p className="text-[10px] text-muted-foreground/70">
                  Hinweis: Details zu einzelnen Transaktionen (Ticker, Beträge) sind nur im PDF-Dokument verfügbar.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
