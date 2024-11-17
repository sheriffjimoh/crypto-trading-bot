'use client';
import useSWR from 'swr';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Analysis() {
  const { data: analyses, error, isLoading } = useSWR('/api/recent-analyses', fetcher, {
    refreshInterval: 30000
  });

  if (error) return (
    <div className="bg-red-50 p-4 rounded-lg">
      <p className="text-red-600">Failed to load analyses</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg shadow p-6">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }


  if (!Array.isArray(analyses) || analyses.length === 0) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {analyses?.map((analysis:any) => (
        <div key={analysis.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg text-gray-700 font-semibold">{analysis.name}</h3>
                <span className="text-sm text-gray-700">Rank #{analysis.marketCapRank}</span>
              </div>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                {analysis.symbol}
              </span>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Price and Changes */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-sm text-gray-700">Price</p>
                <p className="font-medium text-gray-500">${analysis.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">24h</p>
                <p className={`font-medium ${analysis.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.change24h.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700">7d</p>
                <p className={`font-medium ${analysis.change7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.change7d.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Market Analysis */}
            <div>
              <p className="text-sm text-gray-700 mb-2">Market Analysis</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Market Cap:</span>
                  <span className="font-medium">{analysis.analysis.marketCap}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Dominance:</span>
                  <span className="font-medium">{analysis.analysis.dominance}%</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Volume Profile:</span>
                  <span className={`font-medium ${
                    analysis.analysis.volumeProfile === 'Very High' ? 'text-green-600' :
                    analysis.analysis.volumeProfile === 'High' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {analysis.analysis.volumeProfile}
                  </span>
                </div>
              </div>
            </div>

            {/* Price Targets */}
            <div>
              <p className="text-sm text-gray-700 mb-2">Price Targets</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm">
                  <span className="text-gray-700">Support: </span>
                  <span className="font-medium text-gray-500">${analysis.analysis.priceTarget.support}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-700">Resistance: </span>
                  <span className="font-medium text-gray-500">${analysis.analysis.priceTarget.resistance}</span>
                </div>
              </div>
            </div>

            {/* Trends */}
            <div className='text-gray-500'>
              <p className="text-sm text-gray-700 mb-2">Market Trends</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center text-sm">
                  {analysis.trends.shortTerm === 'Bullish' ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span>{analysis.trends.shortTerm}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Activity className="h-4 w-4 text-blue-500 mr-1" />
                  <span>{analysis.trends.volumeTrend}</span>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <p className="text-sm text-gray-700 mb-2">Key Metrics</p>
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="text-gray-700">Volatility: </span>
                  <span className={`font-medium ${
                    analysis.keyMetrics.volatility24h > 5 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {analysis.keyMetrics.volatility24h}%
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-700">ATH Distance: </span>
                  <span className="font-medium text-gray-500">{analysis.keyMetrics.athDistance}%</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-700 text-right">
              Updated: {format(analysis.timestamp, 'HH:mm:ss')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}