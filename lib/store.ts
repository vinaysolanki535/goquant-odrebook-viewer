import { create } from "zustand";
import { Venue, OrderbookData, SimulatedOrder } from "./types";

interface AppState {
  venue: Venue;
  symbol: string;
  orderbook: OrderbookData;
  connectionStatus: "connected" | "disconnected" | "connecting";
  simulatedOrder: Partial<SimulatedOrder>;
  simulationHistory: SimulatedOrder[];

  setVenue: (venue: Venue) => void;
  setSymbol: (symbol: string) => void;
  setOrderbook: (data: OrderbookData) => void;
  setConnectionStatus: (
    status: "connected" | "disconnected" | "connecting"
  ) => void;
  updateSimulatedOrder: (order: Partial<SimulatedOrder>) => void;
  applyDelta: (bids: [string, string][], asks: [string, string][]) => void;
  addSimulationToHistory: (order: SimulatedOrder) => void;
}

const updateLevels = (
  currentLevels: [string, string][],
  updates: [string, string][]
): [string, string][] => {
  const levelMap = new Map(currentLevels);
  updates.forEach(([price, quantity]) => {
    if (Number(quantity) === 0) {
      levelMap.delete(price);
    } else {
      levelMap.set(price, quantity);
    }
  });
  const sortedLevels = Array.from(levelMap.entries());

  return sortedLevels;
};

export const useStore = create<AppState>((set, get) => ({
  venue: "bybit",
  symbol: "BTCUSDT",
  orderbook: { bids: [], asks: [] },
  connectionStatus: "disconnected",
  simulatedOrder: { side: "buy", orderType: "limit" },
  simulationHistory: [],

  setVenue: (venue) => set({ venue, orderbook: { bids: [], asks: [] } }),
  setSymbol: (symbol) => set({ symbol, orderbook: { bids: [], asks: [] } }),
  setOrderbook: (data) => set({ orderbook: data }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  updateSimulatedOrder: (order) =>
    set((state) => ({
      simulatedOrder: { ...state.simulatedOrder, ...order },
    })),

  addSimulationToHistory: (order) =>
    set((state) => ({
      simulationHistory: [order, ...state.simulationHistory],
    })),

  applyDelta: (bids, asks) => {
    const { orderbook } = get();
    const newBids = updateLevels(orderbook.bids, bids);
    const newAsks = updateLevels(orderbook.asks, asks);

    newBids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
    newAsks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));

    set({ orderbook: { bids: newBids, asks: newAsks } });
  },
}));
