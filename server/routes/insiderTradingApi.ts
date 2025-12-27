/**
 * Insider Trading API Router
 * REST endpoints for insider trading data
 */

import express from 'express';
import {
  getInsiderTransactions,
  getInsiderSentiment,
  getInsiderTransactionsByType,
  getInsiderTransactionsByDateRange
} from '../services/insiderTradingService';

const router = express.Router();

/**
 * GET /api/insider-trading/:ticker
 * Get all insider transactions for a stock
 */
router.get('/insider-trading/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker parameter is required' });
    }

    const transactions = await getInsiderTransactions(ticker.toUpperCase());
    
    res.json({
      ticker: ticker.toUpperCase(),
      transactions,
      count: transactions.length
    });
  } catch (error: any) {
    console.error('Error in /api/insider-trading/:ticker:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch insider trading data'
    });
  }
});

/**
 * GET /api/insider-trading/:ticker/sentiment
 * Get insider sentiment analysis for a stock
 */
router.get('/insider-trading/:ticker/sentiment', async (req, res) => {
  try {
    const { ticker } = req.params;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker parameter is required' });
    }

    const sentiment = await getInsiderSentiment(ticker.toUpperCase());
    
    res.json(sentiment);
  } catch (error: any) {
    console.error('Error in /api/insider-trading/:ticker/sentiment:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch insider sentiment'
    });
  }
});

/**
 * GET /api/insider-trading/:ticker/type/:type
 * Get insider transactions filtered by type (buy/sell/all)
 */
router.get('/insider-trading/:ticker/type/:type', async (req, res) => {
  try {
    const { ticker, type } = req.params;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker parameter is required' });
    }

    if (!['buy', 'sell', 'all'].includes(type)) {
      return res.status(400).json({ error: 'Type must be buy, sell, or all' });
    }

    const transactions = await getInsiderTransactionsByType(
      ticker.toUpperCase(),
      type as 'buy' | 'sell' | 'all'
    );
    
    res.json({
      ticker: ticker.toUpperCase(),
      type,
      transactions,
      count: transactions.length
    });
  } catch (error: any) {
    console.error('Error in /api/insider-trading/:ticker/type/:type:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch insider trading data'
    });
  }
});

/**
 * GET /api/insider-trading/:ticker/date-range
 * Get insider transactions within a date range
 * Query params: startDate, endDate (ISO format)
 */
router.get('/insider-trading/:ticker/date-range', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker parameter is required' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate query parameters are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use ISO format (YYYY-MM-DD)' });
    }

    const transactions = await getInsiderTransactionsByDateRange(
      ticker.toUpperCase(),
      start,
      end
    );
    
    res.json({
      ticker: ticker.toUpperCase(),
      startDate: startDate,
      endDate: endDate,
      transactions,
      count: transactions.length
    });
  } catch (error: any) {
    console.error('Error in /api/insider-trading/:ticker/date-range:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch insider trading data'
    });
  }
});

export default router;
