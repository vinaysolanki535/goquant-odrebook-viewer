import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { Venue, Order } from "@/lib/types";

const WEBSOCKET_URLS: Record<Venue, string> = {
  bybit: "wss://stream.bybit.com/v5/public/spot",
  okx: "wss://ws.okx.com:8443/ws/v5/public",
  deribit: "wss://www.deribit.com/ws/api/v2",
};

const getInstrumentName = (venue: Venue, symbol: string): string => {
  switch (venue) {
    case "okx":
      return symbol.replace("USDT", "-USDT");
    case "deribit":
      if (symbol === "BTCUSDT") return "BTC-PERPETUAL";
      if (symbol === "ETHUSDT") return "ETH-PERPETUAL";
      return symbol;
    case "bybit":
    default:
      return symbol;
  }
};

export const useOrderbook = () => {
  const { venue, symbol, setOrderbook, applyDelta, setConnectionStatus } =
    useStore();
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (ws.current) ws.current.close();
    if (!symbol) {
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");
    ws.current = new WebSocket(WEBSOCKET_URLS[venue]);
    const instrument = getInstrumentName(venue, symbol);

    ws.current.onopen = () => {
      console.log(`WebSocket connected to ${venue}`);
      setConnectionStatus("connected");

      let subMsg: object | null = null;
      switch (venue) {
        case "bybit":
          subMsg = { op: "subscribe", args: [`orderbook.50.${instrument}`] };
          break;
        case "okx":
          subMsg = {
            op: "subscribe",
            args: [{ channel: "books", instId: instrument }],
          };
          break;
        case "deribit":
          subMsg = {
            jsonrpc: "2.0",
            method: "public/subscribe",
            params: { channels: [`book.${instrument}.100ms`] },
          };
          break;
      }
      if (subMsg) ws.current?.send(JSON.stringify(subMsg));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (venue === "okx" && data.data === "pong") return;
      if (venue === "deribit" && data.method === "heartbeat") {
        ws.current?.send(
          JSON.stringify({ jsonrpc: "2.0", method: "public/test" })
        );
        return;
      }

      if (venue === "bybit" && data.topic === `orderbook.50.${instrument}`) {
        if (data.type === "snapshot")
          setOrderbook({ bids: data.data.b, asks: data.data.a });
        else if (data.type === "delta") applyDelta(data.data.b, data.data.a);
      } else if (venue === "okx" && data.arg?.channel === "books") {
        if (data.action === "snapshot") setOrderbook(data.data[0]);
        else if (data.action === "update")
          applyDelta(data.data[0].bids, data.data[0].asks);
      } else if (venue === "deribit" && data.method === "subscription") {
        const bookData = data.params.data;
        if (bookData.type === "snapshot") {
          const sanitizeAndSort = (
            orders: [number, number][],
            sortOrder: "asc" | "desc"
          ): Order[] => {
            if (!Array.isArray(orders)) return [];

            const sanitized = orders
              .filter(
                (order) =>
                  typeof order[0] === "number" && typeof order[1] === "number"
              )
              .map(([price, size]): Order => [String(price), String(size)]); // Then convert to strings

            sanitized.sort((a, b) => {
              const priceA = parseFloat(a[0]);
              const priceB = parseFloat(b[0]);
              return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
            });
            return sanitized;
          };

          setOrderbook({
            bids: sanitizeAndSort(bookData.bids, "desc"),
            asks: sanitizeAndSort(bookData.asks, "asc"),
          });
        } else if (bookData.type === "change") {
          const transformDelta = (
            delta: ["new" | "change" | "delete", number, number][]
          ): Order[] => {
            if (!Array.isArray(delta)) return [];

            return delta
              .filter(
                (d) => typeof d[1] === "number" && typeof d[2] === "number"
              )
              .map(([action, price, size]) => {
                const newSize = action === "delete" ? "0" : String(size);
                return [String(price), newSize];
              });
          };
          applyDelta(
            transformDelta(bookData.bids),
            transformDelta(bookData.asks)
          );
        }
      }
    };

    ws.current.onerror = (error) => {
      console.error(`WebSocket error on ${venue}:`, error);
      setConnectionStatus("disconnected");
    };

    ws.current.onclose = () => {
      console.log(`WebSocket disconnected from ${venue}`);
      setConnectionStatus("disconnected");
    };

    const pingInterval =
      venue === "okx"
        ? setInterval(() => {
            ws.current?.send("ping");
          }, 25000)
        : null;

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      ws.current?.close();
    };
  }, [venue, symbol, setOrderbook, applyDelta, setConnectionStatus]);
};
