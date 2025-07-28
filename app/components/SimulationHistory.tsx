"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SimulationHistory() {
  const history = useStore((state) => state.simulationHistory);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation History</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No simulated orders yet. Confirm a simulation to see it here.
          </p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {history.map((order, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={order.side === "buy" ? "success" : "destructive"}
                  >
                    {order.side.toUpperCase()}
                  </Badge>
                  <div className="font-mono">
                    <span>{order.quantity}</span>
                    <span className="text-muted-foreground"> @ </span>
                    <span>${order.price?.toFixed(2) ?? "Market"}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(order.timestamp!).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
