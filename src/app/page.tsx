import { Suspense } from 'react';
import TrendingPairs from '@/app/components/TradingPairs';
import SignalsTable from '@/app/components/SignalsTable';
import Analysis from '@/app/components/Analysis';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">
        Crypto Trading Signals Dashboard
      </h1>
      
       <div className="grid grid-cols-1 gap-8">
        <Suspense fallback={<div>Loading trending pairs...</div>}>
          <TrendingPairs />
        </Suspense>
      </div>

      <div className="mt-8">
        <Suspense fallback={<div>Loading signals...</div>}>
          <SignalsTable />
        </Suspense>
      </div> 
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Recent Analyses</h2>
        <Suspense fallback={<div>Loading analyses...</div>}>
          <Analysis />
        </Suspense>
      </div>
    </main>
  );
}