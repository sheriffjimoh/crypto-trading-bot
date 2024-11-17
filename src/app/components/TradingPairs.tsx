'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TrendingPairs() {
  const { data, error } = useSWR('/api/trending', fetcher, {
    refreshInterval: 300000 // Refresh every 5 minutes
  });

  if (error) return <div>Failed to load trending pairs</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Trending Pairs</h2>
      <div className="space-y-4">
        {data.map((pair: any) => (
          <div key={pair.symbol} className="flex justify-between items-center">
            <span className="font-medium">{pair.symbol}/USDT</span>
            <span className="text-gray-600">${pair.price_btc.toFixed(8)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}