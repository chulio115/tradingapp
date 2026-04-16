"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ResearchCard from "./ResearchCard";
import type { CongressTrade } from "@/types";

interface TradeTableProps {
  trades: CongressTrade[];
}

const partyColors: Record<string, string> = {
  D: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  R: "bg-red-500/10 text-red-500 border-red-500/20",
  I: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function TradeTable({ trades }: TradeTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-8"></TableHead>
            <TableHead>Politician</TableHead>
            <TableHead>Party</TableHead>
            <TableHead>Chamber</TableHead>
            <TableHead>Ticker</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Trade Date</TableHead>
            <TableHead>Filing Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => {
            const isExpanded = expandedId === trade.id;
            const isPurchase = trade.transactionType
              .toLowerCase()
              .includes("purchase");
            return (
              <>
                <TableRow
                  key={trade.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : trade.id)
                  }
                >
                  <TableCell className="w-8">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {trade.politician}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={partyColors[trade.party] ?? partyColors.I}
                    >
                      {trade.party}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize text-xs">
                    {trade.chamber}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-emerald-500 font-medium">
                      {trade.ticker}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isPurchase ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {trade.transactionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{trade.amount}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(trade.transactionDate).toLocaleDateString(
                      "de-DE"
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(trade.filingDate).toLocaleDateString("de-DE")}
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow key={`${trade.id}-research`}>
                    <TableCell colSpan={9} className="p-4 bg-muted/20">
                      <ResearchCard
                        ticker={trade.ticker}
                        tradeContext={`${trade.politician} (${trade.party}) - ${trade.transactionType} ${trade.amount} am ${new Date(trade.transactionDate).toLocaleDateString("de-DE")}`}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
          {trades.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={9}
                className="text-center py-8 text-muted-foreground"
              >
                Keine Trades gefunden
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
