// src/components/forms/OrderForm.tsx
import React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOrderbookStore } from '@/store/orderbookStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SimulatedOrder } from '@/types/orderbook';
import { calculateOrderImpact, findOrderPosition } from '@/lib/calculations';
import { generateOrderId, formatPrice, formatCurrency } from '@/lib/utils';
import { AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react';

const orderFormSchema = z.object({
  exchange: z.enum(['okx', 'bybit', 'deribit']),
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.enum(['buy', 'sell']),
  type: z.enum(['market', 'limit']),
  price: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Valid price required'),
  quantity: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Valid quantity required'),
  timing: z.number().min(0),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

export function OrderForm() {
  const {
    activeExchange,
    activeSymbol,
    orderbooks,
    addSimulatedOrder,
    simulatedOrders,
    removeSimulatedOrder,
  } = useOrderbookStore();

  const [orderImpact, setOrderImpact] = useState<ReturnType<typeof calculateOrderImpact> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      exchange: activeExchange,
      symbol: activeSymbol,
      side: 'buy',
      type: 'limit',
      price: '',
      quantity: '',
      timing: 0,
    },
  });

  const watchedValues = watch();
  const orderbookKey = `${watchedValues.exchange}-${watchedValues.symbol}`;
  const orderbook = orderbooks[orderbookKey];

  // Update form when active exchange/symbol changes
  React.useEffect(() => {
    setValue('exchange', activeExchange);
    setValue('symbol', activeSymbol);
  }, [activeExchange, activeSymbol, setValue]);

  // Calculate order impact whenever form values change
  React.useEffect(() => {
    if (orderbook && watchedValues.quantity && watchedValues.price) {
      const levels = watchedValues.side === 'buy' ? orderbook.asks : orderbook.bids;
      const impact = calculateOrderImpact({
        quantity: Number(watchedValues.quantity),
        side: watchedValues.side,
        price: Number(watchedValues.price),
      }, levels);
      setOrderImpact(impact);
    } else {
      setOrderImpact(null);
    }
  }, [orderbook, watchedValues.quantity, watchedValues.price, watchedValues.side]);

  const onSubmit = (data: OrderFormValues) => {
    if (!orderbook) return;

    const levels = data.side === 'buy' ? orderbook.asks : orderbook.bids;
    const impact = calculateOrderImpact({
      quantity: Number(data.quantity),
      side: data.side,
      price: Number(data.price),
    }, levels);

    const position = findOrderPosition(Number(data.price), data.side, levels);

    const simulatedOrder: SimulatedOrder = {
      id: generateOrderId(),
      exchange: data.exchange,
      symbol: data.symbol,
      side: data.side,
      type: data.type,
      price: data.type === 'limit' ? Number(data.price) : undefined,
      quantity: Number(data.quantity),
      timing: data.timing,
      estimatedFill: impact.fillPercentage,
      marketImpact: impact.marketImpact,
      slippage: impact.slippage,
      position,
    };

    addSimulatedOrder(simulatedOrder);
  };

  const getMarketPrice = () => {
    if (!orderbook) return 0;
    const levels = watchedValues.side === 'buy' ? orderbook.asks : orderbook.bids;
    return levels[0]?.price || 0;
  };

  const setMarketPrice = () => {
    const price = getMarketPrice();
    if (price > 0) {
      setValue('price', price.toString());
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Order Simulation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Exchange and Symbol */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Exchange</label>
                <Select {...register('exchange')}>
                  <option value="okx">OKX</option>
                  <option value="bybit">Bybit</option>
                  <option value="deribit">Deribit</option>
                </Select>
                {errors.exchange && (
                  <p className="text-sm text-red-500 mt-1">{errors.exchange.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Symbol</label>
                <Input {...register('symbol')} placeholder="BTC-USDT" />
                {errors.symbol && (
                  <p className="text-sm text-red-500 mt-1">{errors.symbol.message}</p>
                )}
              </div>
            </div>

            {/* Side and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Side</label>
                <Select {...register('side')}>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Select {...register('type')}>
                  <option value="limit">Limit</option>
                  <option value="market">Market</option>
                </Select>
              </div>
            </div>

            {/* Price and Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Price {watchedValues.type === 'market' && '(Market)'}
                </label>
                <div className="flex gap-2">
                  <Input 
                    {...register('price')} 
                    placeholder="0.00"
                    disabled={watchedValues.type === 'market'}
                  />
                  {watchedValues.type === 'limit' && (
                    <Button type="button" size="sm" onClick={setMarketPrice}>
                      Market
                    </Button>
                  )}
                </div>
                {errors.price && (
                  <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <Input {...register('quantity')} placeholder="0.0000" />
                {errors.quantity && (
                  <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>
                )}
              </div>
            </div>

            {/* Timing */}
            <div>
              <label className="block text-sm font-medium mb-1">Timing Delay</label>
              <Select {...register('timing', { valueAsNumber: true })}>
                <option value={0}>Immediate</option>
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
              </Select>
            </div>

            <Button type="submit" className="w-full">
              Simulate Order
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Order Impact Analysis */}
      {orderImpact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Order Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">Estimated Fill</div>
                <div className="text-lg font-semibold">
                  {orderImpact.fillPercentage.toFixed(2)}%
                </div>
              </div>

              <div>
                <div className="font-medium text-muted-foreground">Average Price</div>
                <div className="text-lg font-semibold">
                  {formatPrice(orderImpact.averageFillPrice)}
                </div>
              </div>

              <div>
                <div className="font-medium text-muted-foreground">Slippage</div>
                <div className={`text-lg font-semibold ${orderImpact.slippage > 1 ? 'text-red-500' : 'text-green-500'}`}>
                  {orderImpact.slippage.toFixed(3)}%
                </div>
              </div>

              <div>
                <div className="font-medium text-muted-foreground">Market Impact</div>
                <div className={`text-lg font-semibold ${orderImpact.marketImpact > 5 ? 'text-red-500' : 'text-green-500'}`}>
                  {orderImpact.marketImpact.toFixed(2)}%
                </div>
              </div>

              <div className="col-span-2">
                <div className="font-medium text-muted-foreground">Total Cost</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(orderImpact.totalCost)}
                </div>
              </div>
            </div>

            {/* Warnings */}
            {(orderImpact.slippage > 1 || orderImpact.marketImpact > 5) && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">High Impact Warning</span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  This order may cause significant market impact or slippage. Consider splitting into smaller orders.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Simulated Orders List */}
      {simulatedOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Simulated Orders ({simulatedOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {simulatedOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={order.side === 'buy' ? 'success' : 'destructive'}>
                      {order.side.toUpperCase()}
                    </Badge>
                    <div className="text-sm">
                      <div className="font-medium">
                        {order.quantity} {order.symbol} @ {order.price ? formatPrice(order.price) : 'Market'}
                      </div>
                      <div className="text-muted-foreground">
                        {order.exchange.toUpperCase()} • Fill: {order.estimatedFill.toFixed(1)}% • 
                        Slippage: {order.slippage.toFixed(3)}%
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSimulatedOrder(order.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}  
