
// src/components/orderbook/OrderbookTable.tsx
import { useEffect, useMemo } from 'react';
import { useOrderbookStore } from '@/store/orderbookStore';
import { OrderbookRow } from './OrderbookRow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, calculatePercentage } from '@/lib/utils';
import { calculateSpread, calculateMidPrice } from '@/lib/calculations';

export function OrderbookTable() {
  const {
    orderbooks,
    activeExchange,
    activeSymbol,
    simulatedOrders,
    isConnected,
    connectToExchange,
  } = useOrderbookStore();

  const orderbookKey = `${activeExchange}-${activeSymbol}`;
  const orderbook = orderbooks[orderbookKey];
  const connected = isConnected[activeExchange];

  useEffect(() => {
    if (!connected) {
      connectToExchange(activeExchange, activeSymbol);
    }
  }, [activeExchange, activeSymbol, connected, connectToExchange]);

  const { displayBids, displayAsks, maxQuantity, spread, midPrice } = useMemo(() => {
    if (!orderbook) {
      return {
        displayBids: [],
        displayAsks: [],
        maxQuantity: 1,
        spread: 0,
        midPrice: 0,
      };
    }

    // Calculate cumulative totals
    let bidTotal = 0;
    const bidsWithTotal = orderbook.bids.slice(0, 15).map(level => {
      bidTotal += level.quantity;
      return { ...level, total: bidTotal };
    });

    let askTotal = 0;
    const asksWithTotal = orderbook.asks.slice(0, 15).map(level => {
      askTotal += level.quantity;
      return { ...level, total: askTotal };
    });

    const allQuantities = [...bidsWithTotal, ...asksWithTotal].map(l => l.quantity);
    const maxQty = Math.max(...allQuantities, 1);

    return {
      displayBids: bidsWithTotal,
      displayAsks: asksWithTotal,
      maxQuantity: maxQty,
      spread: calculateSpread(orderbook.bids, orderbook.asks),
      midPrice: calculateMidPrice(orderbook.bids, orderbook.asks),
    };
  }, [orderbook]);

  const getSimulatedOrderAtLevel = (price: number, side: 'bid' | 'ask') => {
    return simulatedOrders.find(order => 
      order.exchange === activeExchange && 
      order.symbol === activeSymbol &&
      order.price === price &&
      ((side === 'bid' && order.side === 'buy') || (side === 'ask' && order.side === 'sell'))
    );
  };

  if (!orderbook) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Orderbook
            <Badge variant={connected ? "success" : "destructive"}>
              {connected ? "Connected" : "Connecting..."}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            {connected ? "Loading orderbook..." : "Connecting to exchange..."}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <span>{activeSymbol}</span>
            <span className="text-sm font-normal text-muted-foreground ml-2">
              {activeExchange.toUpperCase()}
            </span>
          </div>
          <Badge variant={connected ? "success" : "destructive"}>
            {connected ? "Live" : "Disconnected"}
          </Badge>
        </CardTitle>
        
        {/* Market info */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div>Mid: {formatPrice(midPrice)}</div>
          <div>Spread: {formatPrice(spread)} ({calculatePercentage(spread, midPrice).toFixed(3)}%)</div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-muted/30 text-xs font-semibold">
          <div>Price</div>
          <div className="text-right">Quantity</div>
          <div className="text-right">Total</div>
        </div>
        
        {/* Asks (sells) - displayed in reverse order */}
        <div className="space-y-px">
          {displayAsks.reverse().map((level, index) => (
            <OrderbookRow
              key={`ask-${index}`}
              level={level}
              side="ask"
              maxQuantity={maxQuantity}
              isSimulatedOrder={!!getSimulatedOrderAtLevel(level.price, 'ask')}
            />
          ))}
        </div>
        
        {/* Spread indicator */}
        <div className="py-2 px-4 bg-muted/50 text-center text-sm font-semibold border-y">
          Spread: {formatPrice(spread)}
        </div>
        
        {/* Bids (buys) */}
        <div className="space-y-px">
          {displayBids.map((level, index) => (
            <OrderbookRow
              key={`bid-${index}`}
              level={level}
              side="bid"
              maxQuantity={maxQuantity}
              isSimulatedOrder={!!getSimulatedOrderAtLevel(level.price, 'bid')}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
