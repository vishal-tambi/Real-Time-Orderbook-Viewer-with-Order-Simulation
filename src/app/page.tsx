// src/app/page.tsx
'use client';

import { OrderbookTable } from '@/components/orderbook/OrderbookTable';
import { MarketDepthChart } from '@/components/orderbook/MarketDepthChart';
import { OrderForm } from '@/components/forms/OrderForm';
import { VenueSelector } from '@/components/layout/VenueSelector';

export default function HomePage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Controls */}
      <div className="space-y-6">
        <VenueSelector />
        <OrderForm />
      </div>

      {/* Middle Column - Orderbook */}
      <div className="lg:col-span-1">
        <OrderbookTable />
      </div>

      {/* Right Column - Market Depth */}
      <div className="lg:col-span-1">
        <MarketDepthChart />
      </div>
    </div>
  );
}  
