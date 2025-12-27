import { Router } from 'express';
import { runMonteCarloSimulation } from '../services/monteCarloService';

const router = Router();

/**
 * POST /api/monte-carlo
 * Run Monte Carlo simulation for portfolio
 */
router.post('/', async (req, res) => {
  try {
    const { tickers, allocations, timeHorizonYears, simulationsCount, initialCapital } = req.body;

    // Validation
    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({ error: 'Invalid tickers array' });
    }

    if (!allocations || !Array.isArray(allocations) || allocations.length !== tickers.length) {
      return res.status(400).json({ error: 'Allocations must match tickers length' });
    }

    const allocationSum = allocations.reduce((sum: number, a: number) => sum + a, 0);
    if (Math.abs(allocationSum - 1.0) > 0.001) {
      return res.status(400).json({ error: 'Allocations must sum to 100%' });
    }

    if (!timeHorizonYears || timeHorizonYears <= 0 || timeHorizonYears > 30) {
      return res.status(400).json({ error: 'Time horizon must be between 1 and 30 years' });
    }

    if (!simulationsCount || simulationsCount < 100 || simulationsCount > 50000) {
      return res.status(400).json({ error: 'Simulations count must be between 100 and 50,000' });
    }

    if (!initialCapital || initialCapital <= 0) {
      return res.status(400).json({ error: 'Initial capital must be positive' });
    }

    console.log(`[Monte Carlo API] Running simulation for ${tickers.join(', ')} over ${timeHorizonYears} years with ${simulationsCount} simulations`);

    const result = await runMonteCarloSimulation({
      tickers,
      allocations,
      timeHorizonYears,
      simulationsCount,
      initialCapital,
    });

    res.json(result);
  } catch (error: any) {
    console.error('[Monte Carlo API] Error:', error);
    res.status(500).json({ 
      error: 'Failed to run Monte Carlo simulation',
      details: error.message 
    });
  }
});

export default router;
