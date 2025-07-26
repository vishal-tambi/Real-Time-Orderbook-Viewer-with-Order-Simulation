// src/lib/websocket.ts
import { Exchange } from '@/types/orderbook';

// Instead of: (data: any) => void
// Use:
type MessageHandler = (data: unknown) => void;
interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private messageHandlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private isConnecting = false;
  private shouldReconnect = true;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.messageHandlers.forEach(handler => handler(data));
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnecting = false;
          this.ws = null;

          if (this.shouldReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            setTimeout(() => {
              this.reconnectAttempts++;
              this.connect();
            }, this.config.reconnectInterval);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Instead of: send(message: any)
// Use:
send(message: Record<string, unknown>): void{
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  addMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Exchange-specific WebSocket configurations
export const getWebSocketConfig = (exchange: Exchange): WebSocketConfig => {
  const configs = {
    okx: {
      url: 'wss://ws.okx.com:8443/ws/v5/public',
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
    },
    bybit: {
      url: 'wss://stream.bybit.com/v5/public/linear',
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
    },
    deribit: {
      url: 'wss://www.deribit.com/ws/api/v2',
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
    },
  };

  return configs[exchange];
};

// WebSocket message builders for each exchange
export const buildSubscriptionMessage = (exchange: Exchange, symbol: string) => {
  switch (exchange) {
    case 'okx':
      return {
        op: 'subscribe',
        args: [{
          channel: 'books5',
          instId: symbol
        }]
      };
    
    case 'bybit':
      return {
        op: 'subscribe',
        args: [`orderbook.50.${symbol}`]
      };
    
    case 'deribit':
      return {
        jsonrpc: '2.0',
        method: 'public/subscribe',
        params: {
          channels: [`book.${symbol}.100ms`]
        },
        id: Date.now()
      };
    
    default:
      throw new Error(`Unsupported exchange: ${exchange}`);
  }
};  
