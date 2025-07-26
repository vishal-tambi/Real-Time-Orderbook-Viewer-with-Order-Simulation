// src/app/api/orderbook/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Fallback REST API endpoints for when WebSockets fail
const API_ENDPOINTS = {
  okx: 'https://www.okx.com/api/v5/market/books',
  bybit: 'https://api.bybit.com/v5/market/orderbook',
  deribit: 'https://www.deribit.com/api/v2/public/get_order_book',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exchange = searchParams.get('exchange');
  const symbol = searchParams.get('symbol');

  if (!exchange || !symbol) {
    return NextResponse.json(
      { error: 'Exchange and symbol are required' },
      { status: 400 }
    );
  }

  try {
    let url: string;
    let params: Record<string, string> = {};

    switch (exchange) {
      case 'okx':
        url = API_ENDPOINTS.okx;
        params = { instId: symbol, sz: '20' };
        break;
      case 'bybit':
        url = API_ENDPOINTS.bybit;
        params = { category: 'linear', symbol: symbol, limit: '25' };
        break;
      case 'deribit':
        url = API_ENDPOINTS.deribit;
        params = { instrument_name: symbol, depth: '20' };
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported exchange' },
          { status: 400 }
        );
    }

    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${url}?${queryString}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OrderbookViewer/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform data to standardized format
    let orderbook;
    switch (exchange) {
      case 'okx':
        orderbook = {
          symbol,
          exchange,
          bids: data.data?.[0]?.bids?.map((bid: string[]) => ({
            price: parseFloat(bid[0]),
            quantity: parseFloat(bid[1]),
          })) || [],
          asks: data.data?.[0]?.asks?.map((ask: string[]) => ({
            price: parseFloat(ask[0]),
            quantity: parseFloat(ask[1]),
          })) || [],
          timestamp: Date.now(),
        };
        break;
      case 'bybit':
        orderbook = {
          symbol,
          exchange,
          bids: data.result?.b?.map((bid: string[]) => ({
            price: parseFloat(bid[0]),
            quantity: parseFloat(bid[1]),
          })) || [],
          asks: data.result?.a?.map((ask: string[]) => ({
            price: parseFloat(ask[0]),
            quantity: parseFloat(ask[1]),
          })) || [],
          timestamp: Date.now(),
        };
        break;
      case 'deribit':
        orderbook = {
          symbol,
          exchange,
          bids: data.result?.bids?.map((bid: number[]) => ({
            price: bid[0],
            quantity: bid[1],
          })) || [],
          asks: data.result?.asks?.map((ask: number[]) => ({
            price: ask[0],
            quantity: ask[1],
          })) || [],
          timestamp: Date.now(),
        };
        break;
    }

    return NextResponse.json(orderbook);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orderbook data' },
      { status: 500 }
    );
  }
}  
