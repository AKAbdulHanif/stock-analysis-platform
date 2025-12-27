import express from 'express';
import {
  calculateCoveredCall,
  calculateProtectivePut,
  generateCoveredCallPayoff,
  generateProtectivePutPayoff
} from '../services/optionsStrategyService';

const router = express.Router();

/**
 * POST /api/options/covered-call
 * Calculate covered call strategy metrics
 */
router.post('/covered-call', (req, res) => {
  try {
    const {
      stockPrice,
      strikePrice,
      daysToExpiry,
      riskFreeRate = 0.045,  // Default 4.5% (10-year Treasury)
      volatility,
      dividendYield = 0
    } = req.body;

    // Validation
    if (!stockPrice || !strikePrice || !daysToExpiry || !volatility) {
      return res.status(400).json({
        error: 'Missing required parameters: stockPrice, strikePrice, daysToExpiry, volatility'
      });
    }

    if (stockPrice <= 0 || strikePrice <= 0 || daysToExpiry <= 0 || volatility <= 0) {
      return res.status(400).json({
        error: 'All parameters must be positive numbers'
      });
    }

    // Convert days to years
    const timeToExpiry = daysToExpiry / 365;

    // Calculate covered call strategy
    const result = calculateCoveredCall(
      stockPrice,
      strikePrice,
      timeToExpiry,
      riskFreeRate,
      volatility,
      dividendYield
    );

    // Generate payoff diagram data
    const payoff = generateCoveredCallPayoff(stockPrice, strikePrice, result.premium);

    res.json({
      ...result,
      payoff,
      daysToExpiry
    });
  } catch (error) {
    console.error('[Options API] Covered call error:', error);
    res.status(500).json({ error: 'Failed to calculate covered call strategy' });
  }
});

/**
 * POST /api/options/protective-put
 * Calculate protective put strategy metrics
 */
router.post('/protective-put', (req, res) => {
  try {
    const {
      stockPrice,
      strikePrice,
      daysToExpiry,
      riskFreeRate = 0.045,  // Default 4.5% (10-year Treasury)
      volatility,
      dividendYield = 0
    } = req.body;

    // Validation
    if (!stockPrice || !strikePrice || !daysToExpiry || !volatility) {
      return res.status(400).json({
        error: 'Missing required parameters: stockPrice, strikePrice, daysToExpiry, volatility'
      });
    }

    if (stockPrice <= 0 || strikePrice <= 0 || daysToExpiry <= 0 || volatility <= 0) {
      return res.status(400).json({
        error: 'All parameters must be positive numbers'
      });
    }

    // Convert days to years
    const timeToExpiry = daysToExpiry / 365;

    // Calculate protective put strategy
    const result = calculateProtectivePut(
      stockPrice,
      strikePrice,
      timeToExpiry,
      riskFreeRate,
      volatility,
      dividendYield
    );

    // Generate payoff diagram data
    const payoff = generateProtectivePutPayoff(stockPrice, strikePrice, result.premium);

    res.json({
      ...result,
      payoff,
      daysToExpiry
    });
  } catch (error) {
    console.error('[Options API] Protective put error:', error);
    res.status(500).json({ error: 'Failed to calculate protective put strategy' });
  }
});

export default router;
