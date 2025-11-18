'use client';

import { useState } from 'react';
import { ArbitrageForm } from '@/components/arbitrage-form';
import { ArbitrageResults, ArbitrageCalculateResponse, PathOpportunity } from '@/components/arbitrage-results';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface ArbitrageCalculateRequest {
  start_coin: string;
  start_amount: number;
  mode: string;
}

export default function Home() {
  const [results, setResults] = useState<ArbitrageCalculateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startAmount, setStartAmount] = useState<number>(0);

  const handleCalculate = async (formData: ArbitrageCalculateRequest) => {
    setLoading(true);
    setError(null);
    setResults({
      start_coin: formData.start_coin,
      start_amount: formData.start_amount,
      mode: formData.mode,
      opportunities: [],
      total_count: 0,
      fetch_timestamp: new Date().toISOString(),
    });
    setStartAmount(formData.start_amount);

    try {
      const response = await fetch('/arbitrage/calculate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.body) throw new Error('No response body from server');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Extract JSON objects from the streamed response
        const regex = /\{[^{}]*"path":[^}]*\}/g;
        let match;
        while ((match = regex.exec(buffer)) !== null) {
          try {
            const opp: PathOpportunity = JSON.parse(match[0]);
            setResults((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                opportunities: [...prev.opportunities, opp],
                total_count: prev.opportunities.length + 1,
              };
            });
          } catch {
            // ignore incomplete JSON chunks
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to calculate arbitrage opportunities.');
      console.error('Arbitrage calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Crypto Arbitrage Finder</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Discover profitable trading paths on Bybit spot markets
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>Calculate Opportunities</CardTitle>
              <CardDescription>Enter your trading parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <ArbitrageForm onCalculate={handleCalculate} loading={loading} />
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {loading
                  ? 'Calculating arbitrage opportunities...'
                  : error
                    ? 'Error occurred'
                    : results
                      ? `Found ${results.opportunities.length} opportunity(ies)`
                      : 'Submit the form to see results'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArbitrageResults
                results={results}
                loading={loading}
                error={error}
                startAmount={startAmount}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
