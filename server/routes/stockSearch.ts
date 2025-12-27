import { Router } from 'express';
import { searchSecurities, getSecurityByTicker } from '../../shared/stockUniverse';

const router = Router();

/**
 * GET /api/stock-search?q=query&limit=10
 * Search for stocks and ETFs by ticker or name
 */
router.get('/stock-search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const sectors = req.query.sectors ? (req.query.sectors as string).split(',') : undefined;

    if (!query || query.length < 1) {
      return res.json([]);
    }

    let results = searchSecurities(query, limit * 3); // Get more results for filtering

    // Apply sector filter
    if (sectors && sectors.length > 0) {
      results = results.filter(s => sectors.includes(s.sector));
    }

    // Note: Market cap, P/E ratio, and dividend yield filtering would require
    // real-time stock data. For now, we support sector filtering.
    // In production, you would fetch stock quotes and filter based on these metrics.

    // Limit results
    results = results.slice(0, limit);

    res.json(results);
  } catch (error) {
    console.error('Stock search error:', error);
    res.status(500).json({ error: 'Failed to search stocks' });
  }
});

/**
 * GET /api/stock-search/:ticker
 * Get detailed information for a specific ticker
 */
router.get('/stock-search/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const security = getSecurityByTicker(ticker);

    if (!security) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.json(security);
  } catch (error) {
    console.error('Stock lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup stock' });
  }
});

export default router;
