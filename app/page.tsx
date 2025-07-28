import { DepthChart } from "./components/DepthChart";
import { MetricsPanel } from "./components/MetricsPanel";
import { OrderForm } from "./components/OrderForm";
import { Orderbook } from "./components/Orderbook";
import { SimulationHistory } from "./components/SimulationHistory";
import { VenueSelector } from "./components/VenueSelector";

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Real-Time Orderbook Viewer</h1>
        <p className="text-muted-foreground">
          Simulate orders and visualize market impact across multiple exchanges.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <VenueSelector />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Orderbook />
            <div className="flex flex-col gap-6">
              <DepthChart />
              <SimulationHistory />
            </div>
          </div>
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <OrderForm />
          <MetricsPanel />
        </div>
      </div>
    </div>
  );
}
