'use client';

import { useState, useEffect } from 'react';
import { ArbitrageResults } from '@/components/arbitrage-results';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { api, ArbitrageScanResponse } from '@/lib/api';

export default function Home() {
  const [results, setResults] = useState<ArbitrageScanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchArbitrage = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.scanAllArbitrage(1000);
      setResults(data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan opportunities');
      console.error('Arbitrage scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchArbitrage(); // Initial fetch
    
    const interval = setInterval(() => {
      fetchArbitrage();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Crypto Arbitrage Scanner</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Live circular arbitrage opportunities on Binance spot markets
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Auto-refreshing every 10 seconds {lastUpdate && `• Last update: ${lastUpdate}`}</span>
          </div>
        </div>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Live Arbitrage Opportunities</CardTitle>
            <CardDescription>
              {loading && !results
                ? 'Scanning for arbitrage opportunities...'
                : error
                  ? 'Error occurred'
                  : results
                    ? `Found ${results.opportunities.length} circular arbitrage opportunity(ies)`
                    : 'Loading...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArbitrageResults
              results={results}
              loading={loading && !results}
              error={error}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
