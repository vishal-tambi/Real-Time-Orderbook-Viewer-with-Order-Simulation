// src/components/orderbook/OrderbookRow.tsx
import { OrderbookLevel } from '@/types/orderbook';
import { formatPrice, formatQuantity } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface OrderbookRowProps {
  level: OrderbookLevel;
  side: 'bid' | 'ask';
  isSimulatedOrder?: boolean;
  maxQuantity: number;
}

export function OrderbookRow({ level, side, isSimulatedOrder, maxQuantity }: OrderbookRowProps) {
  const percentage = (level.quantity / maxQuantity) * 100;
  
  return (
    <div
      className={cn(
        "relative flex justify-between items-center px-2 py-1 text-sm font-mono hover:bg-muted/50 transition-colors",
        isSimulatedOrder && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950"
      )}
    >
      {/* Background bar showing relative quantity */}
      <div
        className={cn(
          "absolute inset-0 opacity-20",
          side === 'bid' ? "bg-green-500" : "bg-red-500"
        )}
        style={{ width: `${percentage}%` }}
      />
      
      {/* Price */}
      <span
        className={cn(
          "font-semibold z-10",
          side === 'bid' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        )}
      >
        {formatPrice(level.price)}
      </span>
      
      {/* Quantity */}
      <span className="text-muted-foreground z-10">
        {formatQuantity(level.quantity)}
      </span>
      
      {/* Total (cumulative) */}
      {level.total && (
        <span className="text-xs text-muted-foreground z-10">
          {formatQuantity(level.total)}
        </span>
      )}
      
      {/* Simulated order indicator */}
      {isSimulatedOrder && (
        <div className="absolute right-1 top-1 w-2 h-2 bg-blue-500 rounded-full z-10" />
      )}
    </div>
  );
}
