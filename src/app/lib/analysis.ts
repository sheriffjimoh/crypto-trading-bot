import axios from 'axios';
import { RSI, MACD } from 'technicalindicators';
import { kv } from '@vercel/kv';
import storage from './storage';

interface MACDResult {
  MACD?: number;
  signal?: number;
  histogram?: number;
}

interface AnalysisResult {
  symbol: string;
  price: number;
  change24h: number;
  indicators: {
    rsi: number;
    macd: {
      MACD: number;
      signal: number;
      histogram: number;
    };
  };
  signals: string[];
  confidence: number;
  timestamp: number;
}

interface TrendingPair {
  symbol: string;
  price_btc: number;
  volume_24h?: number;
  market_cap?: number;
  name: string;
  price_usd?: number;
}

interface GainerLoser {
  symbol: string;
  name: string;
  price: number;
  change_24h: number;
  volume_24h: number;
  market_cap: number;
}

export async function analyzeSymbol(symbol: string): Promise<AnalysisResult> {
  try {
    const response = await axios.get(`https://api.binance.com/api/v3/klines`, {
      params: {
        symbol: symbol.toUpperCase(),
        interval: '1h',
        limit: 100
      }
    });

    const marketData = response.data.map((candle: any[]) => ({
      timestamp: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5])
    }));

    const closes = marketData.map((candle: { close: any; }) => candle.close);
    
    // Calculate RSI
    const rsiValues = RSI.calculate({
      values: closes,
      period: 14
    });

    // Calculate MACD
    const macdValues = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: true,
      SimpleMASignal: true
    }) as MACDResult[];

    if (!rsiValues.length || !macdValues.length) {
      throw new Error('Insufficient data for technical analysis');
    }

    const currentRsi = rsiValues[rsiValues.length - 1];
    const currentMacd = macdValues[macdValues.length - 1];
    const currentPrice = closes[closes.length - 1];
    const priceChange24h = ((currentPrice - closes[closes.length - 24]) / closes[closes.length - 24]) * 100;

    const signals: string[] = [];
    let confidence = 0;

    // RSI Signals
    if (currentRsi < 30) {
      signals.push('💡 Oversold conditions (potential buy)');
      confidence += 20;
    } else if (currentRsi > 70) {
      signals.push('⚠️ Overbought conditions (potential sell)');
      confidence -= 20;
    }

    // MACD Signals with proper type checking
    if (typeof currentMacd?.MACD === 'number' && 
        typeof currentMacd?.signal === 'number' && 
        typeof currentMacd?.histogram === 'number') {
        
      if (currentMacd.MACD > currentMacd.signal) {
        signals.push('🚀 MACD bullish signal');
        confidence += 15;
        
        if (currentMacd.histogram > 0) {
          signals.push('📈 Positive MACD momentum');
          confidence += 5;
        }
      } else {
        signals.push('📉 MACD bearish signal');
        confidence -= 15;
        
        if (currentMacd.histogram < 0) {
          signals.push('📉 Negative MACD momentum');
          confidence -= 5;
        }
      }
    }

    if (priceChange24h > 5) {
      signals.push(`📈 Strong upward momentum (+${priceChange24h.toFixed(2)}%)`);
      confidence += 15;
    } else if (priceChange24h < -5) {
      signals.push(`📉 Strong downward momentum (${priceChange24h.toFixed(2)}%)`);
      confidence -= 15;
    }

    confidence = Math.max(0, Math.min(100, confidence + 50));

    if (!currentMacd?.MACD || !currentMacd?.signal || !currentMacd?.histogram) {
      throw new Error('Invalid MACD values');
    }

    const analysisResult: AnalysisResult = {
      symbol,
      price: currentPrice,
      change24h: priceChange24h,
      indicators: {
        rsi: currentRsi,
        macd: {
          MACD: currentMacd.MACD,
          signal: currentMacd.signal,
          histogram: currentMacd.histogram
        }
      },
      signals,
      confidence,
      timestamp: Date.now()
    };

    await storage.set(`analysis:${symbol}`, analysisResult);

    return analysisResult;
  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error(`Failed to analyze symbol ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getTrendingPairs(): Promise<TrendingPair[]> {
  try {
    // First try CoinGecko API
    const response = await axios.get('https://api.coingecko.com/api/v3/search/trending', {
      timeout: 5000
    });

    const trendingPairs = response.data.coins.map((coin: any) => ({
      symbol: coin.item.symbol.toUpperCase(),
      name: coin.item.name,
      price_btc: coin.item.price_btc,
      price_usd: coin.item.price_usd,
      volume_24h: coin.item.volume_24h,
      market_cap: coin.item.market_cap
    }));

    // Store in KV for caching
    await storage.set('trending_pairs', trendingPairs);// Cache for 5 minutes

    return trendingPairs;
  } catch (error) {
    // Try to get from cache if API fails
    const cached = await storage.get('trending_pairs');
    if (cached) {
      return cached as TrendingPair[];
    }
    console.error('Trending pairs error:', error);
    throw new Error('Failed to fetch trending pairs');
  }
}

export async function getTopGainers(): Promise<GainerLoser[]> {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'price_change_percentage_24h_desc',
        per_page: 10,
        page: 1,
        sparkline: false
      },
      timeout: 5000
    });

    const gainers = response.data.map((coin: any) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change_24h: coin.price_change_percentage_24h,
      volume_24h: coin.total_volume,
      market_cap: coin.market_cap
    }));

    // Store in KV for caching
    await storage.set('top_gainers', gainers); // Cache for 5 minutes

    return gainers;
  } catch (error) {
    // Try to get from cache if API fails
    const cached = await storage.get('top_gainers');
    if (cached) {
      return cached as GainerLoser[];
    }
    console.error('Top gainers error:', error);
    throw new Error('Failed to fetch top gainers');
  }
}

export async function getTopLosers(): Promise<GainerLoser[]> {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'price_change_percentage_24h_asc',
        per_page: 10,
        page: 1,
        sparkline: false
      },
      timeout: 5000
    });

    const losers = response.data.map((coin: any) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change_24h: coin.price_change_percentage_24h,
      volume_24h: coin.total_volume,
      market_cap: coin.market_cap
    }));

    // Store in KV for caching
    await storage.set('top_losers', losers); // Cache for 5 minutes

    return losers;
  } catch (error) {
    // Try to get from cache if API fails
    const cached = await storage.get('top_losers');
    if (cached) {
      return cached as GainerLoser[];
    }
    console.error('Top losers error:', error);
    throw new Error('Failed to fetch top losers');
  }
}

export async function getVolumeSurge(): Promise<GainerLoser[]> {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'volume_desc',
        per_page: 20,
        page: 1,
        sparkline: false
      },
      timeout: 5000
    });

    const volumeSurge = response.data
      .filter((coin: any) => coin.total_volume > coin.market_cap * 0.1) // Volume > 10% of market cap
      .map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change_24h: coin.price_change_percentage_24h,
        volume_24h: coin.total_volume,
        market_cap: coin.market_cap,
        volume_market_cap_ratio: (coin.total_volume / coin.market_cap * 100).toFixed(2)
      }))
      .slice(0, 10); // Take top 10

    // Store in KV for caching
    await storage.set('volume_surge', volumeSurge); // Cache for 5 minutes

    return volumeSurge;
  } catch (error) {
    // Try to get from cache if API fails
    const cached = await storage.get('volume_surge');
    if (cached) {
      return cached as GainerLoser[];
    }
    console.error('Volume surge error:', error);
    throw new Error('Failed to fetch volume surge data');
  }
}