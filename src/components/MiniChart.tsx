"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import type { HistoricalPrice } from "@/types";

interface MiniChartProps {
  data: HistoricalPrice[];
  currentPrice?: number;
  color?: string;
  height?: number;
}

export default function MiniChart({
  data,
  currentPrice,
  color,
  height = 120,
}: MiniChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-xs"
        style={{ height }}
      >
        Keine Chartdaten verfügbar
      </div>
    );
  }

  const sorted = [...data].reverse();

  // If we have a current price, append it as "today"
  if (currentPrice != null) {
    const today = new Date().toISOString().split("T")[0];
    const lastDate = sorted[sorted.length - 1]?.date;
    if (lastDate !== today) {
      sorted.push({
        date: today,
        open: currentPrice,
        high: currentPrice,
        low: currentPrice,
        close: currentPrice,
        volume: 0,
      });
    }
  }

  const lastClose = sorted[sorted.length - 1]?.close ?? 0;
  const firstClose = sorted[0]?.close ?? 0;
  const isPositive = lastClose >= firstClose;
  const chartColor = color ?? (isPositive ? "#10b981" : "#ef4444");
  const gradientId = `gradient-${chartColor.replace("#", "")}`;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={sorted}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Kurs"]}
            labelFormatter={(label) => {
              const d = new Date(String(label));
              return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
            }}
          />
          {currentPrice != null && (
            <ReferenceLine
              y={currentPrice}
              stroke={chartColor}
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
          )}
          <Area
            type="monotone"
            dataKey="close"
            stroke={chartColor}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3, fill: chartColor }}
          />
          {currentPrice != null && (
            <ReferenceDot
              x={sorted[sorted.length - 1]?.date}
              y={lastClose}
              r={4}
              fill={chartColor}
              stroke="hsl(var(--background))"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      {currentPrice != null && (
        <div className="absolute top-0 right-0 text-xs font-mono px-1.5 py-0.5 rounded-bl-md" style={{ backgroundColor: `${chartColor}20`, color: chartColor }}>
          ${currentPrice.toFixed(2)}
        </div>
      )}
    </div>
  );
}
