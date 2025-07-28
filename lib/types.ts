export type Venue = "bybit" | "okx" | "deribit";

export type Order = [price: string, quantity: string];

export type OrderbookData = {
  bids: Order[];
  asks: Order[];
};

export type SimulatedOrder = {
  venue: Venue;
  symbol: string;
  side: "buy" | "sell";
  orderType: "limit" | "market";
  price: number;
  quantity: number;
  timestamp?: number;
};
