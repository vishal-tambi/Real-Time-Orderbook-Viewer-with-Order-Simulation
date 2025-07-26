
// src/components/orderbook/MarketDepthChart.tsx
import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useOrderbookStore } from '@/store/orderbookStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MarketDepthChart() {
  const { orderbooks, activeExchange, activeSymbol } = useOrderbookStore();
  
  const orderbookKey = `${activeExchange}-${activeSymbol}`;
  const orderbook = orderbooks[orderbookKey];

  const chartData = useMemo(() => {
    if (!orderbook) return [];

    // Prepare cumulative data for depth chart
    let bidTotal = 0;
    const bidData = orderbook.bids.slice(0, 20).reverse().map(level => {
      bidTotal += level.quantity;
      return {
        price: level.price,
        bidDepth: bidTotal,
        askDepth: 0,
      };
    });

    let askTotal = 0;
    const askData = orderbook.asks.slice(0, 20).map(level => {
      askTotal += level.quantity;
      return {
        price: level.price,
        bidDepth: 0,
        askDepth: askTotal,
      };
    });

    return [...bidData, ...askData].sort((a, b) => a.price - b.price);
  }, [orderbook]);

  if (!orderbook || !chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Depth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading market depth...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Depth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="price" 
                type="number"
                scale="linear"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <YAxis />
              <Area
                type="stepAfter"
                dataKey="bidDepth"
                stackId="1"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.3}
              />
              <Area
                type="stepBefore"
                dataKey="askDepth"
                stackId="2"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}  
