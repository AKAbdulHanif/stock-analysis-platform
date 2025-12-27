import { Router } from 'express';
import { getChartData } from '../services/yahooFinanceService';
import { detectPatterns, getPatternStats } from '../services/candlestickPatternService';

const router = Router();

/**
 * GET /api/candlestick-patterns/:ticker
 * Detect candlestick patterns for a stock
 */
router.get('/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { period = '3mo' } = req.query;

    console.log(`[Candlestick Patterns API] Detecting patterns for ${ticker}`);

    // Fetch historical data
    const chartData = await getChartData(ticker, period as any, '1d');
    const candles = chartData.dataPoints;

    if (!candles || candles.length === 0) {
      return res.status(404).json({ error: 'No historical data found' });
    }

    // Detect patterns
    const patterns = detectPatterns(candles);
    const stats = getPatternStats(patterns);

    console.log(`[Candlestick Patterns API] Found ${patterns.length} patterns for ${ticker}`);

    res.json({
      ticker,
      period,
      patterns,
      stats,
      dataPoints: candles.length
    });

  } catch (error) {
    console.error('[Candlestick Patterns API] Error:', error);
    res.status(500).json({ 
      error: 'Failed to detect patterns',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
