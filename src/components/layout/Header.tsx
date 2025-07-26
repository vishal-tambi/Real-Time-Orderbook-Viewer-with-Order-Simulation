// src/components/layout/Header.tsx
'use client';
import { useOrderbookStore } from '@/store/orderbookStore';
import { Badge } from '@/components/ui/badge';
import { Activity, Wifi, WifiOff } from 'lucide-react';

export function Header() {
  const { activeExchange, activeSymbol, isConnected } = useOrderbookStore();
  const connected = isConnected[activeExchange];

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Orderbook Viewer</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{activeSymbol}</span>
            <span className="text-muted-foreground">on</span>
            <span className="font-medium">{activeExchange.toUpperCase()}</span>
          </div>
          
          <Badge variant={connected ? "success" : "destructive"} className="gap-1">
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? "Live" : "Offline"}
          </Badge>
        </div>
      </div>
    </header>
  );
}
