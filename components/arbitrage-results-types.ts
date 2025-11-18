// arbitrage-results-types.ts

export interface PathOpportunity {
  path: string[];             // The sequence of coins in the arbitrage path
  pairs: string[];            // Corresponding trading pairs for the path
  end_amount: number;         // The resulting amount after completing the path
  profit_percent: number;     // Profit percentage of this arbitrage opportunity
  risk: 'SAFE' | 'MEDIUM';   // <-- Updated to match backend
}

export interface ArbitrageCalculateResponse {
  start_coin: string;                 // The starting coin
  start_amount: number;               // The starting amount
  mode: string;                       // Mode of calculation (e.g., 'fast', 'full')
  opportunities: PathOpportunity[];  // List of arbitrage opportunities found
  total_count: number;                // Total number of opportunities
  fetch_timestamp: string;            // Timestamp when the data was fetched
}
