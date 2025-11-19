'use client';

import { useState, useEffect, useRef } from 'react';
import { ArbitrageResults } from '@/components/arbitrage-results';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { api, ArbitrageScanResponse } from '@/lib/api';

const MAX_MISSES = 2; // keep opportunity for 2 cycles if missing

export default function Home() {
  const [results, setResults] = useState<ArbitrageScanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Track opportunities with stable ID -> {opportunity, misses}
  const opsRef = useRef<Record<string, { op: any; misses: number }>>({});

  const makeId = (op: any) => op.path.join('-');

  const applyNewData = (data: ArbitrageScanResponse | null) => {
    const existing = opsRef.current;
    const next: typeof existing = {};

    if (!data?.opportunities) {
      // On error or empty fetch: increment misses
      Object.entries(existing).forEach(([id, slot]) => {
        const misses = slot.misses + 1;
        if (misses < MAX_MISSES) next[id] = { ...slot, misses };
      });
    } else {
      // Merge new opportunities
      const incomingMap = new Map<string, any>();
      data.opportunities.forEach((op) => incomingMap.set(makeId(op), op));

      // Update existing or add new
      incomingMap.forEach((incomingOp, id) => {
        const prev = existing[id];
        if (prev) {
          next[id] = { op: { ...prev.op, ...incomingOp }, misses: 0 };
        } else {
          next[id] = { op: incomingOp, misses: 0 };
        }
      });

      // Increment misses for missing old opportunities
      Object.entries(existing).forEach(([id, slot]) => {
        if (!next[id]) {
          const misses = slot.misses + 1;
          if (misses < MAX_MISSES) next[id] = { ...slot, misses };
        }
      });
    }

    opsRef.current = next;

    const arr = Object.values(next).map((s) => s.op);
    arr.sort((a, b) => (b.profit_percent ?? 0) - (a.profit_percent ?? 0));

    setResults({
      opportunities: arr,
      total_count: arr.length,
      fetch_timestamp: data?.fetch_timestamp ?? new Date().toISOString(),
    });
  };

  const fetchArbitrage = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.scanAllArbitrage(1000);
      applyNewData(data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan opportunities');
      console.error('Arbitrage scan error:', err);
      applyNewData(null); // keep stale items
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArbitrage();
    const interval = setInterval(fetchArbitrage, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
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
