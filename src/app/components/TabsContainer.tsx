"use client";

import React, { Suspense, useState } from 'react';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center w-full min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

interface TabsContainerProps {
  trendingComponent: React.ReactNode;
  signalsComponent: React.ReactNode;
  analysisComponent: React.ReactNode;
}

export default function TabsContainer({ 
  trendingComponent, 
  signalsComponent, 
  analysisComponent 
}: TabsContainerProps) {
  const [activeTab, setActiveTab] = useState('trending');

  return (
    <div>
      {/* Tabs Navigation */}
      <div className="flex space-x-1 rounded-lg bg-gray-100/80 p-1">
        <button
          onClick={() => setActiveTab('trending')}
          className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'trending'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <span className="hidden sm:block">Trending Pairs</span>
          <span className="sm:hidden">Trending</span>
        </button>

        <button
          onClick={() => setActiveTab('signals')}
          className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'signals'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <span className="hidden sm:block">Trading Signals</span>
          <span className="sm:hidden">Signals</span>
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'analysis'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <span className="hidden sm:block">Recent Analysis</span>
          <span className="sm:hidden">Analysis</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'trending' && (
          <Suspense fallback={<LoadingSpinner />}>
            {trendingComponent}
          </Suspense>
        )}

        {activeTab === 'signals' && (
          <Suspense fallback={<LoadingSpinner />}>
            {signalsComponent}
          </Suspense>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Recent Analyses</h2>
            <Suspense fallback={<LoadingSpinner />}>
              {analysisComponent}
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}