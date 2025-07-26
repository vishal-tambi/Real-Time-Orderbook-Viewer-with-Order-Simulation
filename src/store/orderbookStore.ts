// src/store/orderbookStore.ts
import { create } from 'zustand';
import { Exchange, Orderbook, SimulatedOrder } from '@/types/orderbook';
import { WebSocketManager, getWebSocketConfig, buildSubscriptionMessage } from '@/lib/websocket';

interface OrderbookStore {
    // State
    orderbooks: Record<string, Orderbook>;
    activeExchange: Exchange;
    activeSymbol: string;
    simulatedOrders: SimulatedOrder[];
    isConnected: Record<Exchange, boolean>;
    error: string | null;

    // WebSocket managers
    wsManagers: Record<Exchange, WebSocketManager | null>;

    // Actions
    setActiveExchange: (exchange: Exchange) => void;
    setActiveSymbol: (symbol: string) => void;
    updateOrderbook: (orderbook: Orderbook) => void;
    addSimulatedOrder: (order: SimulatedOrder) => void;
    removeSimulatedOrder: (orderId: string) => void;
    clearSimulatedOrders: () => void;
    connectToExchange: (exchange: Exchange, symbol: string) => Promise<void>;
    disconnectFromExchange: (exchange: Exchange) => void;
    setError: (error: string | null) => void;
    setConnectionStatus: (exchange: Exchange, connected: boolean) => void;
}

// WebSocket message types for different exchanges
interface OkxMessage {
    arg?: {
        channel: string;
        instId: string;
    };
    data?: Array<{
        bids?: [string, string][];
        asks?: [string, string][];
    }>;
}

interface BybitMessage {
    topic?: string;
    data?: {
        b?: [string, string][];
        a?: [string, string][];
    };
}

interface DeribitMessage {
    params?: {
        channel?: string;
        data?: {
            bids?: [number, number][];
            asks?: [number, number][];
        };
    };
}

type ExchangeMessage = OkxMessage | BybitMessage | DeribitMessage;

export const useOrderbookStore = create<OrderbookStore>((set, get) => ({
    // Initial state
    orderbooks: {},
    activeExchange: 'okx',
    activeSymbol: 'BTC-USDT',
    simulatedOrders: [],
    isConnected: {
        okx: false,
        bybit: false,
        deribit: false,
    },
    error: null,
    wsManagers: {
        okx: null,
        bybit: null,
        deribit: null,
    },

    // Actions
    setActiveExchange: (exchange) => {
        set({ activeExchange: exchange });
        const { activeSymbol, connectToExchange } = get();
        connectToExchange(exchange, activeSymbol);
    },

    setActiveSymbol: (symbol) => {
        set({ activeSymbol: symbol });
        const { activeExchange, connectToExchange } = get();
        connectToExchange(activeExchange, symbol);
    },

    updateOrderbook: (orderbook) => {
        const key = `${orderbook.exchange}-${orderbook.symbol}`;
        set((state) => ({
            orderbooks: {
                ...state.orderbooks,
                [key]: orderbook,
            },
        }));
    },

    addSimulatedOrder: (order) => {
        set((state) => ({
            simulatedOrders: [...state.simulatedOrders, order],
        }));
    },

    removeSimulatedOrder: (orderId) => {
        set((state) => ({
            simulatedOrders: state.simulatedOrders.filter((order) => order.id !== orderId),
        }));
    },

    clearSimulatedOrders: () => {
        set({ simulatedOrders: [] });
    },

    connectToExchange: async (exchange, symbol) => {
        const state = get();

        // Disconnect existing connection if any
        if (state.wsManagers[exchange]) {
            state.wsManagers[exchange]?.disconnect();
        }

        try {
            const config = getWebSocketConfig(exchange);
            const wsManager = new WebSocketManager(config);

            // Set up message handler
            wsManager.addMessageHandler((data: unknown) => {
                const orderbook = parseOrderbookMessage(exchange, symbol, data);
                if (orderbook) {
                    get().updateOrderbook(orderbook);
                }
            });

            // Connect and subscribe
            await wsManager.connect();

            // Subscribe to orderbook updates
            const subscriptionMessage = buildSubscriptionMessage(exchange, symbol);
            wsManager.send(subscriptionMessage);

            // Update store
            set((state) => ({
                wsManagers: {
                    ...state.wsManagers,
                    [exchange]: wsManager,
                },
                isConnected: {
                    ...state.isConnected,
                    [exchange]: true,
                },
                error: null,
            }));

        } catch (error) {
            console.error(`Failed to connect to ${exchange}:`, error);
            set((state) => ({
                isConnected: {
                    ...state.isConnected,
                    [exchange]: false,
                },
                error: `Failed to connect to ${exchange}`,
            }));
        }
    },

    disconnectFromExchange: (exchange) => {
        const state = get();
        if (state.wsManagers[exchange]) {
            state.wsManagers[exchange]?.disconnect();

            set((state) => ({
                wsManagers: {
                    ...state.wsManagers,
                    [exchange]: null,
                },
                isConnected: {
                    ...state.isConnected,
                    [exchange]: false,
                },
            }));
        }
    },

    setError: (error) => {
        set({ error });
    },

    setConnectionStatus: (exchange, connected) => {
        set((state) => ({
            isConnected: {
                ...state.isConnected,
                [exchange]: connected,
            },
        }));
    },
}));

// Helper function to parse orderbook messages from different exchanges
function parseOrderbookMessage(exchange: Exchange, symbol: string, data: unknown): Orderbook | null {
    try {
        let bids: [string, string][] | [number, number][] = [];
        let asks: [string, string][] | [number, number][] = [];

        const message = data as ExchangeMessage;

        switch (exchange) {
            case 'okx':
                const okxMessage = message as OkxMessage;
                if (okxMessage.arg?.channel === 'books5' && okxMessage.data?.[0]) {
                    const bookData = okxMessage.data[0];
                    bids = bookData.bids || [];
                    asks = bookData.asks || [];
                }
                break;

            case 'bybit':
                const bybitMessage = message as BybitMessage;
                if (bybitMessage.topic?.includes('orderbook') && bybitMessage.data) {
                    bids = bybitMessage.data.b || [];
                    asks = bybitMessage.data.a || [];
                }
                break;

            case 'deribit':
                const deribitMessage = message as DeribitMessage;
                if (deribitMessage.params?.channel?.includes('book') && deribitMessage.params.data) {
                    bids = deribitMessage.params.data.bids || [];
                    asks = deribitMessage.params.data.asks || [];
                }
                break;

            default:
                return null;
        }

        // Convert to standardized format
        const formatStringLevel = (level: [string, string]) => ({
            price: parseFloat(level[0]),
            quantity: parseFloat(level[1]),
        });

        const formatNumberLevel = (level: [number, number]) => ({
            price: level[0],
            quantity: level[1],
        });

        // Determine format based on exchange
        // Determine format based on exchange and handle types properly
        let formattedBids, formattedAsks;

        if (exchange === 'deribit') {
            formattedBids = (bids as [number, number][])
                .map(formatNumberLevel)
                .sort((a, b) => b.price - a.price);
            formattedAsks = (asks as [number, number][])
                .map(formatNumberLevel)
                .sort((a, b) => a.price - b.price);
        } else {
            formattedBids = (bids as [string, string][])
                .map(formatStringLevel)
                .sort((a, b) => b.price - a.price);
            formattedAsks = (asks as [string, string][])
                .map(formatStringLevel)
                .sort((a, b) => a.price - b.price);
        }

        return {
            symbol,
            exchange,
            bids: formattedBids,
            asks: formattedAsks,
            timestamp: Date.now(),
        };
    } catch (error) {
        console.error('Error parsing orderbook message:', error);
        return null;
    }
}