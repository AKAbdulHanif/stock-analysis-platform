/**
 * News API Router
 * 
 * REST endpoints for fetching financial news
 */

import express from 'express';
import { getStockNews, getPortfolioNews, clearNewsCache, getNewsCacheStats } from '../services/newsService';

const router = express.Router();

/**
 * GET /api/news/:ticker
 * Get news for a specific stock ticker
 */
router.get('/news/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!ticker) {
      return res.status(400).json({ error: 'Ticker parameter is required' });
    }

    const news = await getStockNews(ticker.toUpperCase(), limit);
    
    res.json({
      ticker: ticker.toUpperCase(),
      count: news.length,
      articles: news
    });
  } catch (error: any) {
    console.error('Error in /api/news/:ticker:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to fetch news'
    });
  }
});

/**
 * POST /api/news/portfolio
 * Get news for multiple tickers (portfolio)
 */
router.post('/news/portfolio', async (req, res) => {
  try {
    const { tickers, limitPerStock } = req.body;

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({ error: 'Tickers array is required' });
    }

    const limit = limitPerStock || 5;
    const news = await getPortfolioNews(tickers.map(t => t.toUpperCase()), limit);
    
    res.json({
      tickers: tickers.map(t => t.toUpperCase()),
      count: news.length,
      articles: news
    });
  } catch (error: any) {
    console.error('Error in /api/news/portfolio:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to fetch portfolio news'
    });
  }
});

/**
 * POST /api/news/cache/clear
 * Clear news cache (admin endpoint)
 */
router.post('/news/cache/clear', (req, res) => {
  try {
    clearNewsCache();
    res.json({ message: 'News cache cleared successfully' });
  } catch (error: any) {
    console.error('Error clearing news cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

/**
 * GET /api/news/cache/stats
 * Get cache statistics (admin endpoint)
 */
router.get('/news/cache/stats', (req, res) => {
  try {
    const stats = getNewsCacheStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

export default router;
