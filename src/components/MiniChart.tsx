"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { HistoricalPrice } from "@/types";

interface MiniChartProps {
  data: HistoricalPrice[];
  color?: string;
  height?: number;
}

export default function MiniChart({
  data,
  color,
  height = 120,
}: MiniChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-xs"
        style={{ height }}
      >
        No chart data available
      </div>
    );
  }

  const sorted = [...data].reverse();
  const isPositive =
    sorted.length >= 2
      ? sorted[sorted.length - 1].close >= sorted[0].close
      : true;
  const chartColor = color ?? (isPositive ? "#10b981" : "#ef4444");

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={sorted}>
        <defs>
          <linearGradient id={`gradient-${chartColor}`} x1="0" y1="0" x2="0" y2="1">
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
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "Close"]}
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke={chartColor}
          strokeWidth={1.5}
          fill={`url(#gradient-${chartColor})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
