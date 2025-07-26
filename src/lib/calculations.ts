// src/lib/calculations.ts
import { OrderbookLevel, SimulatedOrder } from '@/types/orderbook';

export interface OrderImpact {
  fillPercentage: number;
  averageFillPrice: number;
  slippage: number;
  marketImpact: number;
  remainingQuantity: number;
  totalCost: number;
}

export function calculateOrderImpact(
  order: Partial<SimulatedOrder>,
  levels: OrderbookLevel[]
): OrderImpact {
  if (!levels.length || !order.quantity) {
    return {
      fillPercentage: 0,
      averageFillPrice: 0,
      slippage: 0,
      marketImpact: 0,
      remainingQuantity: order.quantity || 0,
      totalCost: 0,
    };
  }

  let remainingQuantity = order.quantity;
  let totalCost = 0;
  let totalQuantityFilled = 0;
  let worstPrice = 0;

  const bestPrice = levels[0].price;

  for (const level of levels) {
    if (remainingQuantity <= 0) break;

    const quantityToFill = Math.min(remainingQuantity, level.quantity);
    totalCost += quantityToFill * level.price;
    totalQuantityFilled += quantityToFill;
    remainingQuantity -= quantityToFill;
    worstPrice = level.price;
    console.log(worstPrice)
  }

  const fillPercentage = (totalQuantityFilled / (order.quantity || 1)) * 100;
  const averageFillPrice = totalQuantityFilled > 0 ? totalCost / totalQuantityFilled : 0;
  
  // Calculate slippage as percentage difference from best price
  const slippage = bestPrice > 0 ? Math.abs((averageFillPrice - bestPrice) / bestPrice) * 100 : 0;
  
  // Market impact as percentage of orderbook depth affected
  const marketImpact = calculateMarketImpact(order.quantity || 0, levels);

  return {
    fillPercentage,
    averageFillPrice,
    slippage,
    marketImpact,
    remainingQuantity,
    totalCost,
  };
}

function calculateMarketImpact(orderQuantity: number, levels: OrderbookLevel[]): number {
  const totalAvailableLiquidity = levels.reduce((sum, level) => sum + level.quantity, 0);
  return totalAvailableLiquidity > 0 ? (orderQuantity / totalAvailableLiquidity) * 100 : 0;
}

export function findOrderPosition(
  price: number,
  side: 'buy' | 'sell',
  levels: OrderbookLevel[]
): number {
  if (!levels.length) return -1;

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    
    if (side === 'buy' && price >= level.price) {
      return i;
    }
    if (side === 'sell' && price <= level.price) {
      return i;
    }
  }

  return levels.length; // Order would be at the end
}

export function calculateSpread(bids: OrderbookLevel[], asks: OrderbookLevel[]): number {
  if (!bids.length || !asks.length) return 0;
  
  const bestBid = bids[0].price;
  const bestAsk = asks[0].price;
  
  return bestAsk - bestBid;
}

export function calculateSpreadPercentage(bids: OrderbookLevel[], asks: OrderbookLevel[]): number {
  if (!bids.length || !asks.length) return 0;
  
  const bestBid = bids[0].price;
  const bestAsk = asks[0].price;
  const midPrice = (bestBid + bestAsk) / 2;
  
  return midPrice > 0 ? ((bestAsk - bestBid) / midPrice) * 100 : 0;
}

export function calculateMidPrice(bids: OrderbookLevel[], asks: OrderbookLevel[]): number {
  if (!bids.length || !asks.length) return 0;
  
  return (bids[0].price + asks[0].price) / 2;
}

export function calculateOrderbookImbalance(bids: OrderbookLevel[], asks: OrderbookLevel[]): number {
  const bidVolume = bids.reduce((sum, level) => sum + level.quantity, 0);
  const askVolume = asks.reduce((sum, level) => sum + level.quantity, 0);
  const totalVolume = bidVolume + askVolume;
  
  return totalVolume > 0 ? ((bidVolume - askVolume) / totalVolume) * 100 : 0;
}

export function estimateTimeToFill(
  quantity: number,
  levels: OrderbookLevel[],
  avgVolumePerSecond: number = 100
): number {
  // Simple estimation based on available liquidity and average trading volume
  const availableLiquidity = levels.reduce((sum, level) => sum + level.quantity, 0);
  
  if (quantity <= availableLiquidity) {
    // If enough liquidity exists, estimate based on trading velocity
    return Math.max(1, Math.ceil(quantity / avgVolumePerSecond));
  }
  
  // If not enough liquidity, return a high estimate
  return Math.ceil((quantity - availableLiquidity) / avgVolumePerSecond) + 60;
}  
