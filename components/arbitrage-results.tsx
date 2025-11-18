'use client';

import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, AlertCircle, TrendingUp } from 'lucide-react';

export interface PathOpportunity {
  path: string[];
  pairs: string[];
  start_amount: number;
  end_amount: number;
  profit_percent: number;
  end_coin: string;
  risk: 'SAFE' | 'MEDIUM';
}

export interface ArbitrageCalculateResponse {
  start_coin: string;
  start_amount: number;
  mode: string;
  opportunities: PathOpportunity[];
  total_count: number;
  fetch_timestamp: string;
}

interface ArbitrageResultsProps {
  startCoin: string;
  startAmount: number;
  mode: string;
}

export function ArbitrageResults({ startCoin, startAmount, mode }: ArbitrageResultsProps) {
  const [results, setResults] = useState<ArbitrageCalculateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchArbitrageStream() {
      setLoading(true);
      setError(null);
      setResults({
        start_coin: startCoin,
        start_amount: startAmount,
        mode,
        opportunities: [],
        total_count: 0,
        fetch_timestamp: new Date().toISOString(),
      });

      try {
        const response = await fetch('/arbitrage/calculate/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start_coin: startCoin,
            start_amount: startAmount,
            mode,
          }),
        });

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Extract JSON objects from the stream (simplified)
          let match;
          const regex = /\{[^{}]*"path":[^}]*\}/g;
          while ((match = regex.exec(buffer)) !== null) {
            try {
              const opp: PathOpportunity = JSON.parse(match[0]);
              if (!isMounted) return;

              setResults((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  opportunities: [...prev.opportunities, opp],
                  total_count: prev.opportunities.length + 1,
                };
              });
            } catch {
              // ignore incomplete JSON
            }
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Failed to fetch arbitrage opportunities.');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }

    fetchArbitrageStream();

    return () => {
      isMounted = false;
    };
  }, [startCoin, startAmount, mode]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading && (!results || results.opportunities.length === 0)) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!results || results.opportunities.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No arbitrage opportunities found. Try adjusting your parameters.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Mode: <span className="font-semibold">{results.mode}</span> | Start Coin:{' '}
        <span className="font-semibold">{results.start_coin}</span> | Start Amount:{' '}
        <span className="font-semibold">{startAmount}</span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Path</TableHead>
              <TableHead className="text-right">Start Amount</TableHead>
              <TableHead className="text-right">End Amount</TableHead>
              <TableHead className="text-right">Profit %</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.opportunities.map((opp, idx) => (
              <TableRow key={idx} className="hover:bg-muted/50">
                <TableCell className="font-mono text-sm">
                  <div className="flex flex-col gap-1">
                    {opp.path.map((coin, i) => (
                      <div key={i} className="flex items-center gap-1 flex-wrap">
                        {i > 0 && <ArrowRight className="inline w-3 h-3 mx-1" />}
                        <span className="font-semibold">{coin}</span>
                        {opp.pairs[i] && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({opp.pairs[i]})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">{startAmount.toFixed(6)}</TableCell>
                <TableCell className="text-right font-mono">{opp.end_amount.toFixed(6)}</TableCell>
                <TableCell className="text-right">
                  <div
                    className={`font-semibold flex items-center justify-end gap-1 ${
                      opp.profit_percent > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {opp.profit_percent > 0 && <TrendingUp className="w-4 h-4" />}
                    {opp.profit_percent.toFixed(4)}%
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={opp.risk === 'SAFE' ? 'default' : 'secondary'}>
                    {opp.risk}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground pt-4 border-t">
        {results.opportunities.length} opportunity(ies) found - Sorted by highest profit %
      </div>
    </div>
  );
}
