"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOrderbook } from "@/hooks/useOrderbook";
import { Order, SimulatedOrder } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const OrderbookRow = React.memo(
  ({
    price,
    quantity,
    total,
    type,
    isSimulated,
  }: {
    price: string;
    quantity: string;
    total: number;
    type: "bid" | "ask";
    isSimulated: boolean;
  }) => {
    const priceColor = type === "bid" ? "text-green-500" : "text-red-500";
    const highlightClass = isSimulated
      ? "bg-yellow-500/30 border-2 border-yellow-500"
      : "";

    return (
      <div
        className={`flex justify-between p-1 text-sm rounded-md ${highlightClass}`}
      >
        <span className={priceColor}>
          {price ? parseFloat(price).toFixed(2) : "-"}
        </span>
        <span>{quantity ? parseFloat(quantity).toFixed(4) : "-"}</span>
        <span>{total.toFixed(4)}</span>
      </div>
    );
  }
);
OrderbookRow.displayName = "OrderbookRow";

const OrderbookTable = ({
  data,
  type,
  simulatedOrder,
}: {
  data: Order[];
  type: "bid" | "ask";
  simulatedOrder: Partial<SimulatedOrder>;
}) => {
  let cumulativeTotal = 0;
  const levelsToShow = 15;

  const checkIsSimulated = (price: number) => {
    if (
      !simulatedOrder.price ||
      simulatedOrder.side !== (type === "bid" ? "buy" : "sell")
    ) {
      return false;
    }

    if (simulatedOrder.side === "buy" && type === "ask") {
      const insertIndex = data.findIndex(
        (order) => parseFloat(order[0]) >= simulatedOrder.price!
      );
      const currentPriceIndex = data.findIndex(
        (order) => parseFloat(order[0]) === price
      );
      return insertIndex === currentPriceIndex;
    }
    if (simulatedOrder.side === "sell" && type === "bid") {
      const insertIndex = data.findIndex(
        (order) => parseFloat(order[0]) <= simulatedOrder.price!
      );
      const currentPriceIndex = data.findIndex(
        (order) => parseFloat(order[0]) === price
      );
      return insertIndex === currentPriceIndex;
    }
    return false;
  };

  return (
    <div className="flex-1">
      <div className="flex justify-between text-xs text-muted-foreground p-2 font-semibold">
        <span>Price (USD)</span>
        <span>Quantity</span>
        <span>Total</span>
      </div>
      <div className="flex flex-col gap-0.5">
        {data.slice(0, levelsToShow).map(([price, quantity]) => {
          cumulativeTotal += parseFloat(quantity);
          const isSimulated = checkIsSimulated(parseFloat(price));
          return (
            <OrderbookRow
              key={price}
              price={price}
              quantity={quantity}
              total={cumulativeTotal}
              type={type}
              isSimulated={isSimulated}
            />
          );
        })}
      </div>
    </div>
  );
};

export function Orderbook() {
  useOrderbook();

  const { orderbook, simulatedOrder, connectionStatus } = useStore();
  const { bids, asks } = orderbook;

  const bestBid = bids.length > 0 ? parseFloat(bids[0][0]) : 0;
  const bestAsk = asks.length > 0 ? parseFloat(asks[0][0]) : 0;
  const midPrice = (bestBid + bestAsk) / 2;
  const spread = bestAsk - bestBid;
  const spreadPercentage = midPrice > 0 ? (spread / midPrice) * 100 : 0;
  const isLoading =
    orderbook.bids.length === 0 && connectionStatus !== "disconnected";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orderbook</CardTitle>
        {bestBid > 0 && (
          <div className="text-sm text-muted-foreground flex justify-between">
            <span>Mid Price: ${midPrice.toFixed(2)}</span>
            <span>
              Spread: ${spread.toFixed(2)} ({spreadPercentage.toFixed(4)}%)
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <OrderbookTable
                type="ask"
                data={orderbook.asks}
                simulatedOrder={simulatedOrder}
              />
              <Separator />
              <OrderbookTable
                type="bid"
                data={orderbook.bids}
                simulatedOrder={simulatedOrder}
              />
            </div>
          )}
        </CardContent>
      </CardContent>
    </Card>
  );
}
