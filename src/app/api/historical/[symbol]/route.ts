import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const response = await axios.get(`https://api.binance.com/api/v3/klines`, {
      params: {
        symbol: params.symbol.toUpperCase(),
        interval: '1h',
        limit: 24 // Last 24 hours
      }
    });

    const historicalData = response.data.map((candle: any[]) => ({
      timestamp: candle[0],
      price: parseFloat(candle[4])
    }));

    return NextResponse.json(historicalData);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json({ error: 'Failed to fetch historical data' }, { status: 500 });
  }
}

export const runtime = 'edge';