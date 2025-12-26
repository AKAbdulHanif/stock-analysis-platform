/**
 * Yahoo Finance API Service
 * 
 * Provides stock market data including quotes, historical prices, and company information.
 * Uses Yahoo Finance API v8 with caching and error handling.
 */

import axios, { AxiosError } from 'axios';

// Yahoo Finance API base URL
const YAHOO_FINANCE_API_BASE = 'https://query1.finance.yahoo.com';
const YAHOO_FINANCE_API_V8 = `${YAHOO_FINANCE_API_BASE}/v8/finance`;
const YAHOO_FINANCE_API_V7 = `${YAHOO_FINANCE_API_BASE}/v7/finance`;

// Cache configuration
const CACHE_DURATION_MS = 60 * 1000; // 1 minute for quote data
const CHART_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes for chart data

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache
const quoteCache = new Map<string, CacheEntry<StockQuote>>();
const chartCache = new Map<string, CacheEntry<ChartData>>();

/**
 * Stock quote data structure
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

/**
 * Chart data point
 */
export interface ChartDataPoint {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Chart data structure
 */
export interface ChartData {
  ticker: string;
  dataPoints: ChartDataPoint[];
  period: string;
}

/**
 * Yahoo Finance API error
 */
export class YahooFinanceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public ticker?: string
  ) {
    super(message);
    this.name = 'YahooFinanceError';
  }
}

/**
 * Get stock quote from Yahoo Finance
 */
export async function getStockQuote(ticker: string): Promise<StockQuote> {
  // Check cache first
  const cached = quoteCache.get(ticker);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }

  try {
    const url = `${YAHOO_FINANCE_API_V8}/chart/${ticker}`;
    const response = await axios.get(url, {
      params: {
        interval: '1d',
        range: '1d',
      },
      timeout: 10000, // 10 second timeout
    });

    const result = response.data?.chart?.result?.[0];
    if (!result) {
      throw new YahooFinanceError(
        `No data returned for ticker ${ticker}`,
        404,
        ticker
      );
    }

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    if (!meta || !quote) {
      throw new YahooFinanceError(
        `Invalid data structure for ticker ${ticker}`,
        500,
        ticker
      );
    }

    // Extract quote data
    const currentPrice = meta.regularMarketPrice || meta.previousClose || 0;
    const previousClose = meta.previousClose || meta.chartPreviousClose || 0;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    // Get latest OHLC data
    const timestamps = result.timestamp || [];
    const lastIndex = timestamps.length - 1;
    
    const stockQuote: StockQuote = {
      ticker: ticker.toUpperCase(),
      price: currentPrice,
      change,
      changePercent,
      dayHigh: meta.regularMarketDayHigh || quote.high?.[lastIndex] || currentPrice,
      dayLow: meta.regularMarketDayLow || quote.low?.[lastIndex] || currentPrice,
      open: quote.open?.[lastIndex] || meta.regularMarketOpen || currentPrice,
      previousClose,
      volume: meta.regularMarketVolume || quote.volume?.[lastIndex] || 0,
      marketCap: meta.marketCap,
      peRatio: meta.trailingPE,
      dividendYield: meta.dividendYield ? meta.dividendYield * 100 : undefined,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      timestamp: Date.now(),
    };

    // Cache the result
    quoteCache.set(ticker, {
      data: stockQuote,
      timestamp: Date.now(),
    });

    return stockQuote;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new YahooFinanceError(
          `Ticker ${ticker} not found`,
          404,
          ticker
        );
      }
      throw new YahooFinanceError(
        `Failed to fetch quote for ${ticker}: ${axiosError.message}`,
        axiosError.response?.status,
        ticker
      );
    }
    throw error;
  }
}

/**
 * Get historical chart data from Yahoo Finance
 */
export async function getChartData(
  ticker: string,
  period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max' = '1mo',
  interval: '1m' | '5m' | '15m' | '1h' | '1d' | '1wk' | '1mo' = '1d'
): Promise<ChartData> {
  const cacheKey = `${ticker}-${period}-${interval}`;
  
  // Check cache first
  const cached = chartCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CHART_CACHE_DURATION_MS) {
    return cached.data;
  }

  try {
    const url = `${YAHOO_FINANCE_API_V8}/chart/${ticker}`;
    const response = await axios.get(url, {
      params: {
        interval,
        range: period,
      },
      timeout: 15000, // 15 second timeout for chart data
    });

    const result = response.data?.chart?.result?.[0];
    if (!result) {
      throw new YahooFinanceError(
        `No chart data returned for ticker ${ticker}`,
        404,
        ticker
      );
    }

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0];
    
    if (!quote || !timestamps.length) {
      throw new YahooFinanceError(
        `Invalid chart data structure for ticker ${ticker}`,
        500,
        ticker
      );
    }

    // Build chart data points
    const dataPoints: ChartDataPoint[] = timestamps.map((ts: number, index: number) => {
      const date = new Date(ts * 1000);
      return {
        timestamp: ts * 1000,
        date: date.toISOString().split('T')[0],
        open: quote.open?.[index] || 0,
        high: quote.high?.[index] || 0,
        low: quote.low?.[index] || 0,
        close: quote.close?.[index] || 0,
        volume: quote.volume?.[index] || 0,
      };
    }).filter((dp: ChartDataPoint) => dp.close > 0); // Filter out invalid data points

    const chartData: ChartData = {
      ticker: ticker.toUpperCase(),
      dataPoints,
      period,
    };

    // Cache the result
    chartCache.set(cacheKey, {
      data: chartData,
      timestamp: Date.now(),
    });

    return chartData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new YahooFinanceError(
          `Ticker ${ticker} not found`,
          404,
          ticker
        );
      }
      throw new YahooFinanceError(
        `Failed to fetch chart data for ${ticker}: ${axiosError.message}`,
        axiosError.response?.status,
        ticker
      );
    }
    throw error;
  }
}

/**
 * Get multiple stock quotes in parallel
 */
export async function getMultipleQuotes(tickers: string[]): Promise<StockQuote[]> {
  const promises = tickers.map(ticker => 
    getStockQuote(ticker).catch(error => {
      console.error(`Failed to fetch quote for ${ticker}:`, error.message);
      return null;
    })
  );
  
  const results = await Promise.all(promises);
  return results.filter((quote): quote is StockQuote => quote !== null);
}

/**
 * Clear cache (useful for testing or manual refresh)
 */
export function clearCache(): void {
  quoteCache.clear();
  chartCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    quoteCache: {
      size: quoteCache.size,
      entries: Array.from(quoteCache.keys()),
    },
    chartCache: {
      size: chartCache.size,
      entries: Array.from(chartCache.keys()),
    },
  };
}
