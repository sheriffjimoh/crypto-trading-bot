import { NextResponse } from 'next/server';
import axios from 'axios';
import storage from '@/app/lib/storage';

// Simplified response type
interface TrendingCoin {
  id: string;
  symbol: string;
  name: string;
  price_usd?: number;
  price_btc?: number;
  market_cap?: number;
  volume_24h?: number;
  price_change_24h?: number;
}

export async function GET() {
  try {
    // Try to get cached data first
    const cached = await storage.get('trending_coins');
    if (cached) {
      return NextResponse.json(cached);
    }

    // If no cache, fetch new data
    const marketResponse = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'volume_desc', // Order by volume
          per_page: 15, // Get top 15 coins
          sparkline: false,
          price_change_percentage: '24h'
        },
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0' // Some APIs require a user agent
        }
      }
    );

    const trendingCoins: TrendingCoin[] = marketResponse.data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price_usd: coin.current_price,
      market_cap: coin.market_cap,
      volume_24h: coin.total_volume,
      price_change_24h: coin.price_change_percentage_24h,
      rank: coin.market_cap_rank
    }));

    // Sort by volume and price change to find "trending" coins
    const trending = trendingCoins
      .sort((a, b) => {
        const aScore = (a.volume_24h || 0) * Math.abs(a.price_change_24h || 0);
        const bScore = (b.volume_24h || 0) * Math.abs(b.price_change_24h || 0);
        return bScore - aScore;
      })
      .slice(0, 10); // Get top 10

    // Cache the results for 5 minutes
    await storage.set('trending_coins', trending);

    return NextResponse.json(trending);

  } catch (error) {
    console.error('Error in trending route:', error);
    
    // If error occurs, try to return cached data even if expired
    const cached = await storage.get('trending_coins');
    if (cached) {
      return NextResponse.json({
        data: cached,
        cached: true,
        message: 'Serving cached data due to API error'
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch trending coins' }, 
      { status: 500 }
    );
  }
}

export const runtime = 'edge';