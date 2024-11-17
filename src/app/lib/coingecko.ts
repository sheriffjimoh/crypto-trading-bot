import axios from 'axios';
import storage from './storage';

const BASE_URL = 'https://api.coingecko.com/api/v3';
const CACHE_TIMES = {
  TRENDING: 300, // 5 minutes
  MARKET_DATA: 60, // 1 minute
  COIN_DATA: 120 // 2 minutes
};

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0'
  }
});

// Add rate limiting interceptor
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests

api.interceptors.request.use(async (config) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  return config;
});

export const coingecko = {
  async getMarketData(perPage: number = 20) {
    const cacheKey = `market_data_${perPage}`;
    try {
      // Try cache first
      const cached = await storage.get(cacheKey);
      if (cached) return cached;

      const response = await api.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: perPage,
          sparkline: false,
          price_change_percentage: '24h'
        }
      });

      await storage.set(cacheKey, response.data);
      return response.data;

    } catch (error) {
      console.error('Error fetching market data:', error);
      // Return cached data if available, even if expired
      const cached = await storage.get(cacheKey);
      if (cached) return cached;
      throw error;
    }
  },

  async getTopVolume(limit: number = 15) {
    const cacheKey = `top_volume_${limit}`;
    try {
      const cached = await storage.get(cacheKey);
      if (cached) return cached;

      const response = await api.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'volume_desc',
          per_page: limit,
          sparkline: false,
          price_change_percentage: '24h'
        }
      });

      const data = response.data;
      await storage.set(cacheKey, data);
      return data;

    } catch (error) {
      console.error('Error fetching volume data:', error);
      const cached = await storage.get(cacheKey);
      if (cached) return cached;
      throw error;
    }
  },

  async getPriceChanges(coinIds: string[]) {
    const cacheKey = `price_changes_${coinIds.join('_')}`;
    try {
      const cached = await storage.get(cacheKey);
      if (cached) return cached;

      const response = await api.get('/simple/price', {
        params: {
          ids: coinIds.join(','),
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_24hr_vol: true
        }
      });

      await storage.set(cacheKey, response.data);
      return response.data;

    } catch (error) {
      console.error('Error fetching price changes:', error);
      const cached = await storage.get(cacheKey);
      if (cached) return cached;
      throw error;
    }
  }
};