'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react';

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

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Analysis() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const { data: analyses, error, isLoading } = useSWR<AnalysisResult[]>('/api/recent-analyses', fetcher, {
    refreshInterval: 30000 // Refresh every 30 seconds
  });

  // Get historical data for selected symbol
  const { data: historicalData } = useSWR(
    selectedSymbol ? `/api/historical/${selectedSymbol}` : null,
    fetcher
  );

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-600 bg-green-50';
    if (confidence >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (error) return (
    <div className="bg-red-50 rounded-lg p-4">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
        <p className="text-red-700">Failed to load analyses</p>
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Recent Analyses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analyses?.map((analysis) => (
          <div 
            key={analysis.symbol}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedSymbol(analysis.symbol)}
          >
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{analysis.symbol}</h3>
                <span className={`px-2 py-1 rounded-full text-sm ${getConfidenceColor(analysis.confidence)}`}>
                  {analysis.confidence}% Confidence
                </span>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">${analysis.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">24h Change</p>
                  <p className={`font-medium ${getChangeColor(analysis.change24h)}`}>
                    {analysis.change24h > 0 ? '+' : ''}{analysis.change24h.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Technical Indicators</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">RSI: </span>
                    <span className={analysis.indicators.rsi > 70 ? 'text-red-600' : 
                                  analysis.indicators.rsi < 30 ? 'text-green-600' : ''}>
                      {analysis.indicators.rsi.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">MACD: </span>
                    <span className={analysis.indicators.macd.MACD > 0 ? 'text-green-600' : 'text-red-600'}>
                      {analysis.indicators.macd.MACD.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Signals</p>
                <div className="space-y-1">
                  {analysis.signals.map((signal, index) => (
                    <div key={index} className="text-sm flex items-center">
                      {signal.includes('bullish') ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : signal.includes('bearish') ? (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      ) : (
                        <Activity className="h-4 w-4 text-blue-500 mr-1" />
                      )}
                      {signal}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Updated: {format(analysis.timestamp, 'HH:mm:ss')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Symbol Details */}
      {selectedSymbol && historicalData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">
            {selectedSymbol} Price History
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(timestamp) => format(timestamp, 'HH:mm')}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(label) => format(label, 'HH:mm:ss')}
                  formatter={(value: any) => [`$${parseFloat(value).toLocaleString()}`, 'Price']}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#2563eb"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}