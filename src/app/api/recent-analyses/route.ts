import { NextResponse } from 'next/server';
import axios from 'axios';
import storage from '@/app/lib/storage';

interface Analysis {
  id: string;
  symbol: string;
  name: string;
  marketCapRank: number;
  price: number;
  change24h: number;
  change7d: number;
  analysis: {
    marketCap: string;
    dominance: number;
    volatilityScore: number;
    volumeProfile: string;
    priceTarget: {
      support: number;
      resistance: number;
    };
  };
  trends: {
    shortTerm: string;
    mediumTerm: string;
    volumeTrend: string;
  };
  keyMetrics: {
    marketCapToVolume: number;
    volatility24h: number;
    athDistance: number;
  };
  timestamp: number;
}

export async function GET() {
  try {
    // Check cache first
    const cached = await storage.get('recent_analyses');
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get global market data first
    const globalData = await axios.get('https://api.coingecko.com/api/v3/global');
    const totalMarketCap = globalData.data.data.total_market_cap.usd;

    // Fetch detailed coin data
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 50,
        sparkline: true,
        price_change_percentage: '24h,7d,30d',
        include_market_cap: true,
        include_24hr_vol: true,
        include_ath: true,
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    const analyses: Analysis[] = response.data.map((coin: any) => {
      // Calculate market metrics
      const marketCapDominance = (coin.market_cap / totalMarketCap) * 100;
      const volumeToMarketCap = coin.total_volume / coin.market_cap;
      const athDistance = ((coin.ath - coin.current_price) / coin.ath) * 100;

      // Calculate volatility from sparkline data
      const prices = coin.sparkline_in_7d?.price || [];
      const priceChanges = prices.slice(1).map((price: number, i: number) => 
        ((price - prices[i]) / prices[i]) * 100
      );
      const volatility = priceChanges.reduce((sum: number, change: number) => 
        sum + Math.abs(change), 0) / priceChanges.length;

      // Determine volume profile
      let volumeProfile;
      if (volumeToMarketCap > 0.3) volumeProfile = "Very High";
      else if (volumeToMarketCap > 0.2) volumeProfile = "High";
      else if (volumeToMarketCap > 0.1) volumeProfile = "Moderate";
      else volumeProfile = "Low";

      // Calculate support and resistance
      const recentPrices = prices.slice(-24);
      const support = Math.min(...recentPrices) * 0.98;
      const resistance = Math.max(...recentPrices) * 1.02;

      // Determine trends
      const shortTerm = coin.price_change_percentage_24h > 0 ? "Bullish" : "Bearish";
      const mediumTerm = coin.price_change_percentage_7d_in_currency > 0 ? "Bullish" : "Bearish";
      const volumeTrend = coin.total_volume > (coin.total_volume / 2) ? "Increasing" : "Decreasing";

      // Format market cap for display
      const formatMarketCap = (marketCap: number) => {
        if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
        if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
        return `$${marketCap.toLocaleString()}`;
      };

      return {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        marketCapRank: coin.market_cap_rank,
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h,
        change7d: coin.price_change_percentage_7d_in_currency,
        analysis: {
          marketCap: formatMarketCap(coin.market_cap),
          dominance: parseFloat(marketCapDominance.toFixed(2)),
          volatilityScore: parseFloat(volatility.toFixed(2)),
          volumeProfile,
          priceTarget: {
            support: parseFloat(support.toFixed(2)),
            resistance: parseFloat(resistance.toFixed(2))
          }
        },
        trends: {
          shortTerm,
          mediumTerm,
          volumeTrend
        },
        keyMetrics: {
          marketCapToVolume: parseFloat(volumeToMarketCap.toFixed(2)),
          volatility24h: parseFloat(volatility.toFixed(2)),
          athDistance: parseFloat(athDistance.toFixed(2))
        },
        timestamp: Date.now()
      };
    });

    // Sort by a combination of market cap rank and volatility
    const sortedAnalyses = analyses.sort((a, b) => {
      const scoreA = (a.keyMetrics.volatility24h * 2) + (1 / a.marketCapRank);
      const scoreB = (b.keyMetrics.volatility24h * 2) + (1 / b.marketCapRank);
      return scoreB - scoreA;
    });

    // Take top 9 most interesting analyses
    const topAnalyses = sortedAnalyses.slice(0, 9);

    // Cache for 5 minutes
    await storage.set('recent_analyses', topAnalyses);

    return NextResponse.json(topAnalyses);

  } catch (error) {
    console.error('Error in recent analyses:', error);
    
    const cached = await storage.get('recent_analyses');
    if (cached) {
      return NextResponse.json({
        data: cached,
        cached: true,
        message: 'Serving cached data due to API error'
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch recent analyses' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';