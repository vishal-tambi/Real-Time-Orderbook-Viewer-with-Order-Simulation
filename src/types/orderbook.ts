// src/types/orderbook.ts
export type Exchange = 'okx' | 'bybit' | 'deribit';

export interface OrderbookLevel {
  price: number;
  quantity: number;
  total?: number;
}

export interface Orderbook {
  symbol: string;
  exchange: Exchange;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  timestamp: number;
}

export interface SimulatedOrder {
  id: string;
  exchange: Exchange;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  price?: number;
  quantity: number;
  timing: number; // delay in seconds
  estimatedFill: number;
  marketImpact: number;
  slippage: number;
  position?: number; // position in orderbook
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
}
// Instead of: data: any;
// Use:
export interface WebSocketMessage {
  channel: string;
  data: Record<string, unknown>;
  timestamp: number;
}
export interface OrderFormData {
  exchange: Exchange;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  price: string;
  quantity: string;
  timing: number;
}