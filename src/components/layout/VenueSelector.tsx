
// src/components/layout/VenueSelector.tsx
import { useOrderbookStore } from '@/store/orderbookStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Exchange } from '@/types/orderbook';
import { Settings } from 'lucide-react';

const POPULAR_SYMBOLS = [
  'BTC-USDT',
  'ETH-USDT',
  'BTC-USD',
  'ETH-USD',
  'SOL-USDT',
  'DOGE-USDT',
];

export function VenueSelector() {
  const { 
    activeExchange, 
    activeSymbol, 
    isConnected,
    setActiveExchange, 
    setActiveSymbol 
  } = useOrderbookStore();

  const exchanges: { value: Exchange; label: string; }[] = [
    { value: 'okx', label: 'OKX' },
    { value: 'bybit', label: 'Bybit' },
    { value: 'deribit', label: 'Deribit' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Market Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Exchange Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Exchange</label>
          <div className="grid grid-cols-3 gap-2">
            {exchanges.map((exchange) => (
              <Button
                key={exchange.value}
                variant={activeExchange === exchange.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveExchange(exchange.value)}
                className="relative"
              >
                {exchange.label}
                {isConnected[exchange.value] && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Symbol Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Symbol</label>
          <Input
            value={activeSymbol}
            onChange={(e) => setActiveSymbol(e.target.value)}
            placeholder="Enter symbol (e.g. BTC-USDT)"
            className="mb-2"
          />
          
          {/* Popular symbols */}
          <div className="flex flex-wrap gap-1">
            {POPULAR_SYMBOLS.map((symbol) => (
              <Badge
                key={symbol}
                variant={activeSymbol === symbol ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setActiveSymbol(symbol)}
              >
                {symbol}
              </Badge>
            ))}
          </div>
        </div>

        {/* Connection Status */}
        <div className="pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            <div className="font-medium mb-1">Connection Status</div>
            <div className="grid grid-cols-3 gap-2">
              {exchanges.map((exchange) => (
                <div key={exchange.value} className="flex items-center gap-1 text-xs">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      isConnected[exchange.value] ? 'bg-green-500' : 'bg-red-500'
                    }`} 
                  />
                  {exchange.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}  
  
