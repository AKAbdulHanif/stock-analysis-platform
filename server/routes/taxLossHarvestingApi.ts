import { Router } from 'express';
import { analyzeTaxLossHarvesting } from '../services/taxLossHarvestingService';

const router = Router();

/**
 * POST /api/tax-loss-harvesting
 * Analyze portfolio holdings for tax-loss harvesting opportunities
 */
router.post('/', async (req, res) => {
  try {
    const { holdings } = req.body;
    
    // Validate input
    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({
        error: 'Invalid request: holdings array is required',
      });
    }
    
    // Validate each holding
    for (const holding of holdings) {
      if (!holding.ticker || !holding.shares || !holding.purchasePrice || !holding.purchaseDate) {
        return res.status(400).json({
          error: 'Invalid holding: ticker, shares, purchasePrice, and purchaseDate are required',
        });
      }
      
      if (holding.shares <= 0 || holding.purchasePrice <= 0) {
        return res.status(400).json({
          error: 'Invalid holding: shares and purchasePrice must be positive',
        });
      }
    }
    
    console.log(`[Tax-Loss Harvesting API] Analyzing ${holdings.length} holdings`);
    
    // Analyze holdings
    const result = await analyzeTaxLossHarvesting(holdings);
    
    console.log(`[Tax-Loss Harvesting API] Found ${result.losingPositions.length} losing positions with $${result.totalTaxSavings.toFixed(2)} potential tax savings`);
    
    // Convert Map to object for JSON serialization
    const replacementSuggestionsObj: Record<string, any[]> = {};
    result.replacementSuggestions.forEach((value, key) => {
      replacementSuggestionsObj[key] = value;
    });
    
    res.json({
      losingPositions: result.losingPositions,
      replacementSuggestions: replacementSuggestionsObj,
      totalTaxSavings: result.totalTaxSavings,
      totalUnrealizedLoss: result.totalUnrealizedLoss,
      summary: result.summary,
    });
  } catch (error) {
    console.error('[Tax-Loss Harvesting API] Error:', error);
    res.status(500).json({
      error: 'Failed to analyze tax-loss harvesting opportunities',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
