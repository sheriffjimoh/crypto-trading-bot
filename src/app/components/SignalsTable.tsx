'use client';

import useSWR from 'swr';
import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';

interface Signal {
  symbol: string;
  price: number;
  price_change_24h: number;
  signals: string[];
  confidence: number;
  timestamp: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SignalsTable() {
  const { data, error, isLoading } = useSWR<Signal[]>('/api/signals', fetcher, {
    refreshInterval: 60000 // Refresh every minute
  });

  console.log({
    data,
    error,
    isLoading
  })

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (error) return (
    <div className="bg-red-50 p-4 rounded-lg">
      <p className="text-red-600">Failed to load signals: {error}</p>
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


  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          <p className="text-yellow-600">No analysis data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Trading Signals</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                24h Change
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Signals
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th> */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-black">
            {data?.map((signal, index) => (
              <tr key={`${signal.symbol}__${index}key`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium">{signal.symbol}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${signal.price.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getChangeColor(signal.price_change_24h)}>
                    {signal.price_change_24h > 0 ? '↑' : '↓'} {Math.abs(signal.price_change_24h).toFixed(2)}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {signal.signals.map((s, i) => (
                      <div key={i} className="text-sm text-gray-600">
                        {s}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`font-medium ${getConfidenceColor(signal.confidence)}`}>
                    {signal.confidence}%
                  </span>
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(signal.timestamp), 'HH:mm:ss')}
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}