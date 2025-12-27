/**
 * Stock API Routes
 * 
 * Provides REST API endpoints for stock market data
 */

import { Router, Request, Response } from 'express';
import {
  getStockQuote,
  getChartData,
  getMultipleQuotes,
  YahooFinanceError,
  clearCache,
  getCacheStats,
} from '../services/yahooFinanceService';
import { cacheAside, generateCacheKey, CacheTTL } from '../services/cacheService';

const router = Router();

/**
 * GET /api/stock-quote/:ticker
 * Get current stock quote
 */
router.get('/stock-quote/:ticker', async (req: Request, res: Response) => {
  try {
    const { ticker } = req.params;
    
    if (!ticker || ticker.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Ticker symbol is required',
      });
    }

    const tickerUpper = ticker.trim().toUpperCase();
    const cacheKey = generateCacheKey('quote', tickerUpper);
    
    // Use cache-aside pattern
    const quote = await cacheAside(
      cacheKey,
      CacheTTL.STOCK_QUOTE,
      () => getStockQuote(tickerUpper)
    );
    res.json(quote);
  } catch (error) {
    if (error instanceof YahooFinanceError) {
      return res.status(error.statusCode || 500).json({
        error: error.name,
        message: error.message,
        ticker: error.ticker,
      });
    }
    
    console.error('Error fetching stock quote:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch stock quote',
    });
  }
});

/**
 * GET /api/stock-chart/:ticker
 * Get historical chart data
 * Query params: period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max), interval (1m, 5m, 15m, 1h, 1d, 1wk, 1mo)
 */
router.get('/stock-chart/:ticker', async (req: Request, res: Response) => {
  try {
    const { ticker } = req.params;
    const { period = '1mo', interval = '1d' } = req.query;
    
    if (!ticker || ticker.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Ticker symbol is required',
      });
    }

    // Validate period
    const validPeriods = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'];
    if (!validPeriods.includes(period as string)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid period. Must be one of: ${validPeriods.join(', ')}`,
      });
    }

    // Validate interval
    const validIntervals = ['1m', '5m', '15m', '1h', '1d', '1wk', '1mo'];
    if (!validIntervals.includes(interval as string)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid interval. Must be one of: ${validIntervals.join(', ')}`,
      });
    }

    const tickerUpper = ticker.trim().toUpperCase();
    const cacheKey = generateCacheKey('chart', tickerUpper, period as string, interval as string);
    
    // Use shorter TTL for short-term charts (1d, 5d), longer for historical
    const ttl = ['1d', '5d'].includes(period as string) 
      ? CacheTTL.STOCK_CHART_SHORT 
      : CacheTTL.STOCK_CHART_LONG;
    
    // Use cache-aside pattern
    const chartData = await cacheAside(
      cacheKey,
      ttl,
      () => getChartData(tickerUpper, period as any, interval as any)
    );
    
    res.json(chartData);
  } catch (error) {
    if (error instanceof YahooFinanceError) {
      return res.status(error.statusCode || 500).json({
        error: error.name,
        message: error.message,
        ticker: error.ticker,
      });
    }
    
    console.error('Error fetching chart data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch chart data',
    });
  }
});

/**
 * POST /api/stock-quotes
 * Get multiple stock quotes
 * Body: { tickers: string[] }
 */
router.post('/stock-quotes', async (req: Request, res: Response) => {
  try {
    const { tickers } = req.body;
    
    if (!Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Request body must contain a non-empty array of tickers',
      });
    }

    if (tickers.length > 50) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Maximum 50 tickers allowed per request',
      });
    }

    const tickersUpper = tickers.map(t => t.trim().toUpperCase());
    const cacheKey = generateCacheKey('quotes', tickersUpper.sort().join(','));
    
    // Use cache-aside pattern for batch quotes
    const quotes = await cacheAside(
      cacheKey,
      CacheTTL.STOCK_QUOTE,
      () => getMultipleQuotes(tickersUpper)
    );
    res.json({ quotes });
  } catch (error) {
    console.error('Error fetching multiple quotes:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch stock quotes',
    });
  }
});

/**
 * POST /api/stock-cache/clear
 * Clear the stock data cache (admin endpoint)
 */
router.post('/stock-cache/clear', (req: Request, res: Response) => {
  try {
    clearCache();
    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to clear cache',
    });
  }
});

/**
 * GET /api/stock-cache/stats
 * Get cache statistics (admin endpoint)
 */
router.get('/stock-cache/stats', (req: Request, res: Response) => {
  try {
    const stats = getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch cache stats',
    });
  }
});

export default router;
