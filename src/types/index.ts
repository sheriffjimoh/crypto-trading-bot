export interface CandleData {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }
  
  export interface MACDResult {
    MACD: number;
    signal: number;
    histogram: number;
  }
  
  export interface AnalysisResult {
    symbol: string;
    price: number;
    change24h: number;
    indicators: {
      rsi: number;
      macd: MACDResult;
    };
    signals: string[];
    confidence: number;
    timestamp: number;
  }
  
  export interface TrendingPair {
    symbol: string;
    price_btc: number;
    volume_24h: number;
  }
  
  export interface PriceHistoryPoint {
    timestamp: number;
    price: number;
  }