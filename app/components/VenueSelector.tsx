"use client";

import { useStore } from "@/lib/store";
import { Venue } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ConnectionStatusIndicator = () => {
  const status = useStore((state) => state.connectionStatus);

  const statusConfig = {
    connected: { color: "bg-green-500", text: "Connected" },
    connecting: { color: "bg-yellow-500", text: "Connecting..." },
    disconnected: { color: "bg-red-500", text: "Disconnected" },
  };

  const { color, text } = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${color} animate-pulse`} />
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
};

export function VenueSelector() {
  const { venue, setVenue } = useStore();

  const handleVenueChange = (value: string) => {
    setVenue(value as Venue);
  };

  return (
    <div className="flex items-center justify-between">
      <Tabs value={venue} onValueChange={handleVenueChange}>
        <TabsList>
          <TabsTrigger value="bybit">Bybit</TabsTrigger>
          <TabsTrigger value="okx">OKX</TabsTrigger>
          <TabsTrigger value="deribit">Deribit</TabsTrigger>
        </TabsList>
      </Tabs>
      <ConnectionStatusIndicator />
    </div>
  );
}
