'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { ArbitrageCalculateRequest } from '@/lib/api';

const formSchema = z.object({
  start_coin: z.string().min(1, 'Please select a starting coin'),
  start_amount: z.number().min(1, 'Amount must be at least 1'),
  mode: z.enum(['START_ONLY', 'POPULAR_END', 'BOTH']),
});

type FormData = z.infer<typeof formSchema>;

const POPULAR_COINS = ['USDT', 'USDC', 'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'TRX', 'DOGE', 'ADA'];

interface ArbitrageFormProps {
  onCalculate: (data: ArbitrageCalculateRequest) => void;
  loading: boolean;
}

export function ArbitrageForm({ onCalculate, loading }: ArbitrageFormProps) {
  const [customCoin, setCustomCoin] = useState('');

  const form = useForm<ArbitrageCalculateRequest>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_coin: 'USDT',
      start_amount: 1000,
      mode: 'BOTH',
    },
  });

  const handleSubmit = (data: ArbitrageCalculateRequest) => {
    onCalculate(data);
  };

  const handleCustomCoin = () => {
    if (customCoin.trim()) {
      form.setValue('start_coin', customCoin.toUpperCase());
      setCustomCoin('');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Start Coin */}
        <FormField
          control={form.control}
          name="start_coin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Starting Coin</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a coin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POPULAR_COINS.map((coin) => (
                    <SelectItem key={coin} value={coin}>
                      {coin}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>The coin to start arbitrage from</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Custom Coin */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Or enter custom coin</label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., BTC"
              value={customCoin}
              onChange={(e) => setCustomCoin(e.target.value)}
              className="text-sm"
            />
            <Button
              type="button"
              onClick={handleCustomCoin}
              variant="outline"
              size="sm"
            >
              Set
            </Button>
          </div>
        </div>

        {/* Start Amount */}
        <FormField
          control={form.control}
          name="start_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="1000"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  min="1"
                  step="0.01"
                />
              </FormControl>
              <FormDescription>Amount to use for calculation</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Mode */}
        <FormField
          control={form.control}
          name="mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Search Mode</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="START_ONLY">
                    <span>Start Only</span>
                    <p className="text-xs text-muted-foreground">Return to starting coin</p>
                  </SelectItem>
                  <SelectItem value="POPULAR_END">
                    <span>Popular End</span>
                    <p className="text-xs text-muted-foreground">End in major coins</p>
                  </SelectItem>
                  <SelectItem value="BOTH">
                    <span>Both</span>
                    <p className="text-xs text-muted-foreground">Any end coin</p>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Where arbitrage paths should end</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            'Calculate Opportunities'
          )}
        </Button>
      </form>
    </Form>
  );
}
