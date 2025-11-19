'use client';

import { useState, useEffect, useRef } from 'react';
import { ArbitrageResults } from '@/components/arbitrage-results';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

type PathOpportunity = {
  path: string[];      // e.g. ['BTC','ETH','BNB','BTC']
  pairs: string[];     // symbols used
  start_amount: number;
  end_amount: number;
  profit_percent: number;
  end_coin: string;
  risk?: string;
  // any other fields returned by backend
};

type ArbitrageScanResponse = {
  opportunities: PathOpportunity[];
  total_count?: number;
  fetch_timestamp?: string;
};

const MAX_MISSES = 2; // only remove an opportunity after it misses N scans

export default function Home() {
  const [results, setResults] = useState<ArbitrageScanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Track opportunities by stable id -> {opportunity, misses}
  // id chosen as path.join('-') which matches how you identify a cycle
  const opsRef = useRef<Record<string, { op: PathOpportunity; misses: number }>>({});

  const makeId = (op: PathOpportunity) => op.path.join('-');

  const applyNewData = (data: ArbitrageScanResponse | null) => {
    const existing = opsRef.current;
    const next: typeof existing = {};

    if (!data || !Array.isArray(data.opportunities)) {
      // No data returned: increment misses for all, remove those with too many misses
      Object.entries(existing).forEach(([id, slot]) => {
        const misses = (slot.misses ?? 0) + 1;
        if (misses < MAX_MISSES) {
          next[id] = { op: slot.op, misses };
        }
        // otherwise drop it (it has missed too many times)
      });
    } else {
      // Build map of incoming opportunities
      const incomingMap = new Map<string, PathOpportunity>();
      data.opportunities.forEach((op) => {
        incomingMap.set(makeId(op), op);
      });

      // For every incoming op: either update existing or add new (misses = 0)
      incomingMap.forEach((incomingOp, id) => {
        const prev = existing[id];
        if (prev) {
          // update fields while preserving object identity when possible
          // create a merged object to pass to UI (keeps consistent shape)
          const merged = {
            ...prev.op,
            ...incomingOp,
          };
          next[id] = { op: merged, misses: 0 };
        } else {
          next[id] = { op: incomingOp, misses: 0 };
        }
      });

      // For any existing that didn't appear in incoming, increment misses
      Object.entries(existing).forEach(([id, slot]) => {
        if (!next[id]) {
          const misses = (slot.misses ?? 0) + 1;
          if (misses < MAX_MISSES) {
            next[id] = { op: slot.op, misses };
          }
        }
      });
    }

    // Replace ref
    opsRef.current = next;

    // Turn into array to render, sorting by profit_percent desc (keeps stable order)
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
      // On error, do not wipe results — instead increment misses to let stale items persist briefly
      applyNewData(null);
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
