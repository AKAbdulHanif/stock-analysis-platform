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

    if (!query || query.length < 1) {
      return res.json([]);
    }

    const results = searchSecurities(query, limit);
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
