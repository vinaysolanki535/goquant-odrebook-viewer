"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const MetricItem = ({
  label,
  value,
  tooltipText,
}: {
  label: string;
  value: string;
  tooltipText: string;
}) => (
  <div className="flex justify-between items-center text-sm">
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger>
            <Info className="h-3.5 w-3.5 text-muted-foreground/80" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
    <span className="font-mono font-semibold">{value}</span>
  </div>
);

export function MetricsPanel() {
  const { orderbook, simulatedOrder } = useStore();

  const metrics = useMemo(() => {
    const { orderType, price = 0, quantity = 0, side } = simulatedOrder;

    if (
      !quantity ||
      !side ||
      !orderType ||
      (orderbook.bids.length === 0 && orderbook.asks.length === 0)
    ) {
      return { fillPrice: 0, slippage: 0, cost: 0, filledQuantity: 0 };
    }

    if (orderType === "limit" && !price) {
      return { fillPrice: 0, slippage: 0, cost: 0, filledQuantity: 0 };
    }

    const relevantBook = side === "buy" ? orderbook.asks : orderbook.bids;
    const sortedBook = [...relevantBook].sort((a, b) =>
      side === "buy"
        ? parseFloat(a[0]) - parseFloat(b[0])
        : parseFloat(b[0]) - parseFloat(a[0])
    );

    let quantityToFill = quantity;
    let totalCost = 0;
    let filledQuantity = 0;

    for (const order of sortedBook) {
      if (quantityToFill <= 0) break;

      const levelPrice = parseFloat(order[0]);
      const levelQuantity = parseFloat(order[1]);

      if (orderType === "limit") {
        if (side === "buy" && levelPrice > price) break;
        if (side === "sell" && levelPrice < price) break;
      }

      const fillable = Math.min(quantityToFill, levelQuantity);
      if (fillable > 0) {
        totalCost += fillable * levelPrice;
        filledQuantity += fillable;
        quantityToFill -= fillable;
      }
    }

    const bestMarketPrice =
      sortedBook.length > 0 ? parseFloat(sortedBook[0][0]) : 0;
    const fillPrice = filledQuantity > 0 ? totalCost / filledQuantity : 0;
    const slippage =
      bestMarketPrice > 0 && fillPrice > 0
        ? Math.abs(((fillPrice - bestMarketPrice) / bestMarketPrice) * 100)
        : 0;
    const cost = totalCost;

    const totalBidVolume = orderbook.bids
      .slice(0, 15)
      .reduce((acc, curr) => acc + parseFloat(curr[1]), 0);
    const totalAskVolume = orderbook.asks
      .slice(0, 15)
      .reduce((acc, curr) => acc + parseFloat(curr[1]), 0);
    const totalVolume = totalBidVolume + totalAskVolume;
    const imbalance =
      totalVolume > 0 ? (totalBidVolume / totalVolume) * 100 : 50;

    return { fillPrice, slippage, cost, filledQuantity, imbalance };
  }, [orderbook, simulatedOrder]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impact Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <MetricItem
          label="Book Imbalance"
          value={
            metrics.imbalance ? `${metrics.imbalance.toFixed(2)}%` : "0.00%"
          }
          tooltipText="The ratio of buy-side liquidity vs. sell-side liquidity in the top 15 levels. >50% is bullish."
        />
        <MetricItem
          label="Est. Fill Price"
          value={`$${metrics.fillPrice.toFixed(2)}`}
          tooltipText="The average price at which your simulated order would be filled."
        />
        <MetricItem
          label="Slippage"
          value={`${metrics.slippage.toFixed(4)}%`}
          tooltipText="The percentage difference between the best market price and your estimated fill price."
        />
        <MetricItem
          label="Total Cost/Proceeds"
          value={`$${metrics.cost.toFixed(2)}`}
          tooltipText="The total estimated value of the simulated transaction."
        />
        <MetricItem
          label="Fill Amount"
          value={`${metrics.filledQuantity.toFixed(4)}`}
          tooltipText="The total quantity of the asset that can be filled based on your order type and the available liquidity."
        />
      </CardContent>
    </Card>
  );
}
