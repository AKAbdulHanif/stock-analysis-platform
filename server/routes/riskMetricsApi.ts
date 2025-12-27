/**
 * Risk Metrics API Router
 * REST endpoints for portfolio risk analysis
 */

import express from 'express';
import { getPortfolioRiskMetrics } from '../services/portfolioRiskMetricsService';

const router = express.Router();

/**
 * POST /api/risk-metrics
 * Get comprehensive risk metrics for a portfolio
 */
router.post('/risk-metrics', async (req, res) => {
  try {
    const { tickers, weights } = req.body;
    
    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({ error: 'Tickers array is required' });
    }
    
    if (weights && (!Array.isArray(weights) || weights.length !== tickers.length)) {
      return res.status(400).json({ error: 'Weights must match tickers length' });
    }
    
    const metrics = await getPortfolioRiskMetrics(tickers, weights);
    
    res.json({
      tickers,
      weights: weights || tickers.map(() => 1 / tickers.length),
      metrics: {
        sharpeRatio: Number(metrics.sharpeRatio.toFixed(2)),
        beta: Number(metrics.beta.toFixed(2)),
        maxDrawdown: Number((metrics.maxDrawdown * 100).toFixed(2)),
        valueAtRisk95: Number((metrics.valueAtRisk95 * 100).toFixed(2)),
        valueAtRisk99: Number((metrics.valueAtRisk99 * 100).toFixed(2)),
        annualizedVolatility: Number((metrics.annualizedVolatility * 100).toFixed(2)),
        downsideDeviation: Number((metrics.downsideDeviation * 100).toFixed(2)),
        sortinoRatio: Number(metrics.sortinoRatio.toFixed(2))
      },
      volatilityHistory: metrics.volatilityHistory
    });
  } catch (error: any) {
    console.error('Error in /api/risk-metrics:', error);
    res.status(500).json({
      error: error.message || 'Failed to calculate risk metrics'
    });
  }
});

export default router;
