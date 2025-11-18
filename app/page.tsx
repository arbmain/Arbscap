'use client';

import React from 'react';
import { ArbitrageCalculateResponse } from '@/lib/api';

interface ArbitrageResultsProps {
  results: ArbitrageCalculateResponse | null;
  loading: boolean;
  error: string | null;
}

export const ArbitrageResults: React.FC<ArbitrageResultsProps> = ({ results, loading, error }) => {
  if (loading) return <p>Calculating...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!results || results.opportunities.length === 0) return <p>No opportunities found.</p>;

  return (
    <div className="space-y-4">
      {results.opportunities.map((opportunity, idx) => (
        <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition">
          {/* Display path with pairs */}
          <p className="font-mono">
            {opportunity.path.map((coin, i) => {
              const pair = opportunity.pairs[i] || '';
              return i < opportunity.pairs.length
                ? `${coin} (${pair}) → `
                : coin;
            })}
          </p>

          {/* Profit and risk */}
          <p className="mt-2">
            <span className="font-bold">Profit:</span> {opportunity.profit_percent.toFixed(2)}%
            {' | '}
            <span className={`font-bold ${opportunity.risk === 'SAFE' ? 'text-green-600' : 'text-yellow-600'}`}>
              Risk: {opportunity.risk}
            </span>
          </p>

          {/* Start and end amounts */}
          <p className="text-sm text-muted-foreground">
            Start: {opportunity.start_amount} {results.start_coin} → End: {opportunity.end_amount} {opportunity.end_coin}
          </p>
        </div>
      ))}
    </div>
  );
};
