'use client';

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
import { ArbitrageCalculateResponse } from '@/lib/api';

interface ArbitrageResultsProps {
  results: ArbitrageCalculateResponse | null;
  loading: boolean;
  error: string | null;
}

export function ArbitrageResults({ results, loading, error }: ArbitrageResultsProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
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
        Mode: <span className="font-semibold">{results.mode}</span> | Starting Amount:{' '}
        <span className="font-semibold">{results.start_amount}</span> {results.start_coin}
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
                <TableCell className="text-right font-mono">
                  {opp.start_amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {opp.end_amount.toFixed(2)}
                </TableCell>
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
