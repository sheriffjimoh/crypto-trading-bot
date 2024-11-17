import { NextResponse } from 'next/server';
import axios from 'axios';
import storage from '@/app/lib/storage';

export async function GET() {
  try {
    // Try to get from cache first
    const cached = await storage.get('market_data');
    if (cached && Date.now() - (cached as any).timestamp < 300000) { // 5 minutes cache
      return NextResponse.json(cached);
    }

    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 50,
        page: 1,
        sparkline: false
      }
    });

    const marketData = {
      data: response.data,
      timestamp: Date.now()
    };

    // Cache the results
    await storage.set('market_data', marketData);

    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}

export const runtime = 'edge';