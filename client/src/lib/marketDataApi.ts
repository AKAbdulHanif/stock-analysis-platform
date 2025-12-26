/**
 * Market Data API Integration
 * Fetches real-time stock data using backend Yahoo Finance API
 */

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  timestamp: number;
}

export interface ChartDataPoint {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartData {
  ticker: string;
  dataPoints: ChartDataPoint[];
  period: string;
}

// Cache for API responses to reduce calls
const quoteCache: Map<string, { data: StockQuote; timestamp: number }> = new Map();
const chartCache: Map<string, { data: ChartData; timestamp: number }> = new Map();
const QUOTE_CACHE_DURATION = 60000; // 1 minute cache
const CHART_CACHE_DURATION = 300000; // 5 minute cache

/**
 * Fetch current stock quote from backend API
 */
export async function fetchStockQuote(ticker: string): Promise<StockQuote | null> {
  try {
    // Check cache first
    const cached = quoteCache.get(ticker);
    if (cached && Date.now() - cached.timestamp < QUOTE_CACHE_DURATION) {
      return cached.data;
    }

    // Call backend API
    const response = await fetch(`/api/stock-quote/${ticker}`);

    if (!response.ok) {
      console.error(`API error for ${ticker}:`, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error(`API error for ${ticker}:`, data.error);
      return null;
    }

    // Cache the result
    quoteCache.set(ticker, { data, timestamp: Date.now() });

    return data;
  } catch (error) {
    console.error(`Error fetching quote for ${ticker}:`, error);
    return null;
  }
}

/**
 * Fetch historical chart data for a stock
 */
export async function fetchStockChart(
  ticker: string,
  period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' = '1mo',
  interval: '1m' | '5m' | '15m' | '1h' | '1d' | '1wk' | '1mo' = '1d'
): Promise<ChartData | null> {
  try {
    const cacheKey = `${ticker}-${period}-${interval}`;
    
    // Check cache first
    const cached = chartCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CHART_CACHE_DURATION) {
      return cached.data;
    }

    const response = await fetch(`/api/stock-chart/${ticker}?period=${period}&interval=${interval}`);

    if (!response.ok) {
      console.error(`API error for ${ticker}:`, response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.error(`API error for ${ticker}:`, data.error);
      return null;
    }

    // Cache the result
    chartCache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  } catch (error) {
    console.error(`Error fetching chart for ${ticker}:`, error);
    return null;
  }
}

/**
 * Fetch multiple stock quotes in parallel
 */
export async function fetchMultipleQuotes(tickers: string[]): Promise<Map<string, StockQuote | null>> {
  const results = new Map<string, StockQuote | null>();
  
  const promises = tickers.map(async (ticker) => {
    const quote = await fetchStockQuote(ticker);
    results.set(ticker, quote);
  });

  await Promise.all(promises);
  return results;
}

/**
 * Clear the price cache
 */
export function clearPriceCache(): void {
  quoteCache.clear();
  chartCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { quotes: { size: number; entries: string[] }, charts: { size: number; entries: string[] } } {
  return {
    quotes: {
      size: quoteCache.size,
      entries: Array.from(quoteCache.keys())
    },
    charts: {
      size: chartCache.size,
      entries: Array.from(chartCache.keys())
    }
  };
}
