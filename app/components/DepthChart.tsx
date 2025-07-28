"use client";

import { useStore } from "@/lib/store";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const processDataForChart = (
  bids: [string, string][],
  asks: [string, string][]
) => {
  let bidTotal = 0;
  const processedBids = bids
    .slice(0, 50)
    .reverse()
    .map(([price, size]) => {
      bidTotal += parseFloat(size);
      return { price: parseFloat(price), bids: bidTotal };
    });

  let askTotal = 0;
  const processedAsks = asks.slice(0, 50).map(([price, size]) => {
    askTotal += parseFloat(size);
    return { price: parseFloat(price), asks: askTotal };
  });

  const combinedData = [...processedBids, ...processedAsks];
  return combinedData.sort((a, b) => a.price - b.price);
};

export function DepthChart() {
  const { orderbook } = useStore();

  const chartData = useMemo(
    () => processDataForChart(orderbook.bids, orderbook.asks),
    [orderbook]
  );

  return (
    <Card className="h-fit col-span-1">
      <CardHeader>
        <CardTitle>Market Depth</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "#d1d5db" }}
              formatter={(value, name) => [
                `${Number(value).toFixed(4)}`,
                name === "bids" ? "Cumulative Bids" : "Cumulative Asks",
              ]}
            />
            <XAxis dataKey="price" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <YAxis
              orientation="right"
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <Area
              type="step"
              dataKey="bids"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.2}
            />
            <Area
              type="step"
              dataKey="asks"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
