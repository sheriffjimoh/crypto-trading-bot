import { NextResponse } from 'next/server';
import axios from 'axios';
import storage from '@/app/lib/storage';

// Types
interface CoinSignal {
  symbol: string;
  name: string;
  price: number;
  price_change_24h: number;
  volume_24h: number;
  market_cap: number;
  signals: string[];
  confidence: number;
  sparkline: number[];
}

export async function GET() {
  try {
    // Check cache first
    const cached = await storage.get('market_signals');
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch market data from CoinGecko
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 50,
        sparkline: true,
        price_change_percentage: '24h,7d'
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    const signals: CoinSignal[] = response.data.map((coin: any) => {
      // Calculate signals
      const signals = [];
      let confidence = 50; // Base confidence

      // Price Change Signals
      if (coin.price_change_percentage_24h > 5) {
        signals.push('🚀 Strong upward momentum');
        confidence += 10;
      } else if (coin.price_change_percentage_24h > 2) {
        signals.push('📈 Upward trend');
        confidence += 5;
      } else if (coin.price_change_percentage_24h < -5) {
        signals.push('📉 Sharp decline');
        confidence -= 10;
      }

      // Volume Analysis
      const volumeToMarketCap = coin.total_volume / coin.market_cap;
      if (volumeToMarketCap > 0.2) {
        signals.push('🔥 High trading activity');
        confidence += 10;
      } else if (volumeToMarketCap > 0.1) {
        signals.push('📊 Above average volume');
        confidence += 5;
      }

      // Price Trend Analysis (using sparkline data)
      if (coin.sparkline_in_7d?.price) {
        const prices = coin.sparkline_in_7d.price;
        const lastPrice = prices[prices.length - 1];
        const startPrice = prices[0];
        const weeklyChange = ((lastPrice - startPrice) / startPrice) * 100;

        if (weeklyChange > 10) {
          signals.push('💫 Strong weekly trend');
          confidence += 10;
        } else if (weeklyChange < -10) {
          signals.push('⚠️ Weekly downtrend');
          confidence -= 10;
        }

        // Momentum analysis
        const recentPrices = prices.slice(-12); // Last 12 hours
        const isUptrend = recentPrices.every((price: number, i: number) => 
          i === 0 || price >= recentPrices[i - 1]
        );
        
        if (isUptrend) {
          signals.push('✨ Continuous uptrend');
          confidence += 5;
        }
      }

      // Market Cap Position
      if (coin.market_cap_rank <= 10) {
        signals.push('👑 Top 10 crypto');
        confidence += 5;
      }

      // Normalize confidence between 0 and 100
      confidence = Math.max(0, Math.min(100, confidence));

      return {
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        price_change_24h: coin.price_change_percentage_24h,
        volume_24h: coin.total_volume,
        market_cap: coin.market_cap,
        signals,
        confidence,
        sparkline: coin.sparkline_in_7d?.price || []
      };
    });

    // Sort by confidence score
    const sortedSignals = signals.sort((a, b) => b.confidence - a.confidence);

    // Cache the results for 5 minutes
    await storage.set('market_signals', sortedSignals);

    return NextResponse.json(sortedSignals);

  } catch (error) {
    console.error('Error generating signals:', error);
    
    // Try to return cached data if available
    const cached = await storage.get('market_signals');
    if (cached) {
      return NextResponse.json({
        data: cached,
        cached: true,
        message: 'Serving cached data due to API error'
      });
    }

    return NextResponse.json(
      { error: 'Failed to generate signals' }, 
      { status: 500 }
    );
  }
}

export const runtime = 'edge';