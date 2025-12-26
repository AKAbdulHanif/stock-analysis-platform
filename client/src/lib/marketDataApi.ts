/**
 * Market Data API Integration
 * Fetches real-time stock data using Manus Data API (Yahoo Finance)
 */

export interface StockQuote {
  symbol: string;
  price: number;
  currency: string;
  exchange: string;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  volume: number;
  marketCap: number;
  pe: number;
  eps: number;
  dividend: number;
  lastUpdate: string;
}

export interface ChartData {
  timestamp: number[];
  open: (number | null)[];
  high: (number | null)[];
  low: (number | null)[];
  close: (number | null)[];
  volume: (number | null)[];
  adjClose: (number | null)[];
}

// Cache for API responses to reduce calls
const priceCache: Map<string, { data: StockQuote; timestamp: number }> = new Map();
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Fetch current stock quote from Manus Data API
 */
export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    // Check cache first
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Call Manus Data API
    const response = await fetch("/api/stock-quote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ symbol })
    });

    if (!response.ok) {
      console.error(`API error for ${symbol}:`, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error(`API error for ${symbol}:`, data.error);
      return null;
    }

    const quote: StockQuote = {
      symbol: data.symbol || symbol,
      price: data.price || 0,
      currency: data.currency || "USD",
      exchange: data.exchange || "",
      dayHigh: data.dayHigh || 0,
      dayLow: data.dayLow || 0,
      fiftyTwoWeekHigh: data.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: data.fiftyTwoWeekLow || 0,
      volume: data.volume || 0,
      marketCap: data.marketCap || 0,
      pe: data.pe || 0,
      eps: data.eps || 0,
      dividend: data.dividend || 0,
      lastUpdate: new Date().toISOString()
    };

    // Cache the result
    priceCache.set(symbol, { data: quote, timestamp: Date.now() });

    return quote;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch historical chart data for a stock
 */
export async function fetchStockChart(
  symbol: string,
  range: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" = "1mo"
): Promise<ChartData | null> {
  try {
    const response = await fetch("/api/stock-chart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ symbol, range })
    });

    if (!response.ok) {
      console.error(`API error for ${symbol}:`, response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.error(`API error for ${symbol}:`, data.error);
      return null;
    }

    const chartData: ChartData = {
      timestamp: data.timestamp || [],
      open: data.open || [],
      high: data.high || [],
      low: data.low || [],
      close: data.close || [],
      volume: data.volume || [],
      adjClose: data.adjClose || []
    };

    return chartData;
  } catch (error) {
    console.error(`Error fetching chart for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch multiple stock quotes in parallel
 */
export async function fetchMultipleQuotes(symbols: string[]): Promise<Map<string, StockQuote | null>> {
  const results = new Map<string, StockQuote | null>();
  
  const promises = symbols.map(async (symbol) => {
    const quote = await fetchStockQuote(symbol);
    results.set(symbol, quote);
  });

  await Promise.all(promises);
  return results;
}

/**
 * Clear the price cache
 */
export function clearPriceCache(): void {
  priceCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: priceCache.size,
    entries: Array.from(priceCache.keys())
  };
}
