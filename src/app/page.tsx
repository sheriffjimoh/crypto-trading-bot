// app/page.tsx
import React from 'react';
import TabsContainer from './components/TabsContainer';
import TrendingPairs from '@/app/components/TradingPairs';
import SignalsTable from '@/app/components/SignalsTable';
import Analysis from '@/app/components/Analysis';

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
        Crypto Trading Signals Dashboard
      </h1>

      <TabsContainer
        trendingComponent={<TrendingPairs />}
        signalsComponent={<SignalsTable />}
        analysisComponent={<Analysis />}
      />
    </main>
  );
}