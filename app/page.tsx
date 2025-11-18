'use client';

import { useState } from 'react';
import { ArbitrageForm } from '@/components/arbitrage-form';
import { ArbitrageResults } from '@/components/arbitrage-results';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { api, ArbitrageCalculateRequest, ArbitrageCalculateResponse } from '@/lib/api';

export default function Home() {
  const [results, setResults] = useState<ArbitrageCalculateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startAmount, setStartAmount] = useState<number>(0); // Track dynamic start amount

  const handleCalculate = async (formData: ArbitrageCalculateRequest) => {
    setLoading(true);
    setError(null);
    setStartAmount(formData.start_amount); // update start amount dynamically

    try {
      const data = await api.calculateArbitrage(formData);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate opportunities');
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
                startAmount={startAmount} // ✅ pass the required prop
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
        }
