'use client';
import useSWR from 'swr';
// useEffect 
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber } from '@/app/lib/util';


const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TrendingPairs() {
  const { data, error } = useSWR('/api/trending', fetcher, {
    refreshInterval: 300000 // Refresh every 5 minutes
  });
  

  if (error) return <div>Failed to load trending pairs</div>;
  if (!data) return <div>Loading...</div>;

  return (
   <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Top Trending Pairs</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-left text-sm font-semibold text-gray-600">Rank</th>
              <th className="pb-3 text-left text-sm font-semibold text-gray-600">Pair</th>
              <th className="pb-3 text-right text-sm font-semibold text-gray-600">Price</th>
              <th className="pb-3 text-right text-sm font-semibold text-gray-600">24h Change</th>
              <th className="pb-3 text-right text-sm font-semibold text-gray-600">Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.map((pair: any, index: any) => (
              <tr key={pair.symbol} className="hover:bg-gray-50">
                <td className="py-4">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                    {index + 1}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">{pair.symbol}/USDT</span>
                  </div>
                </td>
                <td className="py-4 text-right font-medium text-gray-900">
                  ${Number(pair.price_usd).toFixed(8)}
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end">
                    {pair.price_change_24h > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span
                      className={`font-medium ${
                        pair.price_change_24h >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {Math.abs(pair.price_change_24h).toFixed(2)}%
                    </span>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <span
                    className={`font-medium ${
                      pair.volume_change_24h > 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    ${formatNumber(pair.volume_24h)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}