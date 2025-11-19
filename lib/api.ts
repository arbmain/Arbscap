/**
 * Centralized API configuration for backend communication
 * Change BACKEND_URL here to update across the entire app
 */

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'https://scrapper-h4xe.onrender.com';

// API Types
export interface ArbitrageCalculateRequest {
  start_coin: string;
  start_amount: number;
  mode: 'START_ONLY' | 'POPULAR_END' | 'BOTH';
}

export interface ArbitrageOpportunity {
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
  opportunities: ArbitrageOpportunity[];
  total_count: number | null;
  fetch_timestamp: string;
}

export interface GraphInfoResponse {
  coins_count: number;
  pairs_count: number;
  fetch_timestamp: string;
}

export interface HealthResponse {
  status: string;
  service: string;
}

export interface ArbitrageScanResponse {
  opportunities: ArbitrageOpportunity[];
  total_count: number;
  fetch_timestamp: string;
}

async function parseStreamedJSON(response: Response): Promise<ArbitrageCalculateResponse | ArbitrageScanResponse> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body to read');

  const decoder = new TextDecoder('utf-8');
  let resultStr = '';
  let done = false;

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    done = streamDone;
    if (value) {
      resultStr += decoder.decode(value, { stream: !done });
    }
  }

  // Backend streams a complete JSON object at the end
  try {
    return JSON.parse(resultStr);
  } catch (err) {
    throw new Error(`Failed to parse streamed JSON: ${(err as Error).message}`);
  }
}

// API Functions
export const api = {
  /**
   * Calculate arbitrage opportunities (streamed)
   */
  calculateArbitrage: async (
    data: ArbitrageCalculateRequest
  ): Promise<ArbitrageCalculateResponse> => {
    const response = await fetch(`${BACKEND_URL}/arbitrage/calculate/stream`, {
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

    return parseStreamedJSON(response) as Promise<ArbitrageCalculateResponse>;
  },

  /**
   * Refresh data from backend
   */
  refreshData: async (): Promise<{ status: string; fetch_timestamp: string; coins_count: number }> => {
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

  /**
   * Auto-scan all circular arbitrage opportunities (no form input needed)
   */
  scanAllArbitrage: async (startAmount: number = 1000): Promise<ArbitrageScanResponse> => {
    const response = await fetch(`${BACKEND_URL}/arbitrage/scan/stream?start_amount=${startAmount}&limit=50`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.statusText} - ${errorText}`);
    }

    return parseStreamedJSON(response) as Promise<ArbitrageScanResponse>;
  },
};
