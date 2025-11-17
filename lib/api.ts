/**
 * Centralized API configuration for backend communication
 * Change BACKEND_URL here to update across the entire app
 */

// Backend URL - Change this for different environments
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://scrapper-z0kx.onrender.com';

// API Types
export interface ArbitrageCalculateRequest {
  start_coin: string;
  start_amount: number;
  mode: 'START_ONLY' | 'POPULAR_END' | 'BOTH';
}

export interface ArbitrageOpportunity {
  path: string[];
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
  opportunities: ArbitrageOpportunity[];
}

export interface GraphInfoResponse {
  total_coins: number;
  total_pairs: number;
  total_edges: number;
  last_updated: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

// API Functions
export const api = {
  /**
   * Calculate arbitrage opportunities
   */
  calculateArbitrage: async (
    data: ArbitrageCalculateRequest
  ): Promise<ArbitrageCalculateResponse> => {
    const response = await fetch(`${BACKEND_URL}/arbitrage/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  },

  /**
   * Refresh data from Bybit API
   */
  refreshData: async (): Promise<{ message: string; timestamp: string }> => {
    const response = await fetch(`${BACKEND_URL}/arbitrage/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh data: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get graph information
   */
  getGraphInfo: async (): Promise<GraphInfoResponse> => {
    const response = await fetch(`${BACKEND_URL}/graph/info`);

    if (!response.ok) {
      throw new Error(`Failed to fetch graph info: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Health check
   */
  healthCheck: async (): Promise<HealthResponse> => {
    const response = await fetch(`${BACKEND_URL}/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  },
};
