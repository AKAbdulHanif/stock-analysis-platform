import { Router } from 'express';
import { screenStocks, getPresetScreens, type ScreenerFilters } from '../services/stockScreenerService';

const router = Router();

/**
 * POST /api/screener
 * Screen stocks with custom filters
 */
router.post('/', async (req, res) => {
  try {
    const filters: ScreenerFilters = req.body;
    
    console.log('[Stock Screener API] Screening with filters:', JSON.stringify(filters));
    
    const results = await screenStocks(filters);
    
    res.json(results);
    
  } catch (error) {
    console.error('[Stock Screener API] Error:', error);
    res.status(500).json({
      error: 'Failed to screen stocks',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/screener/presets
 * Get preset screening criteria
 */
router.get('/presets', (req, res) => {
  try {
    const presets = getPresetScreens();
    
    res.json({
      presets,
      available: Object.keys(presets)
    });
    
  } catch (error) {
    console.error('[Stock Screener API] Error getting presets:', error);
    res.status(500).json({
      error: 'Failed to get presets',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/screener/preset/:name
 * Run a preset screen
 */
router.get('/preset/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const presets = getPresetScreens();
    
    if (!presets[name]) {
      return res.status(404).json({ error: `Preset "${name}" not found` });
    }
    
    console.log(`[Stock Screener API] Running preset screen: ${name}`);
    
    const results = await screenStocks(presets[name]);
    
    res.json({
      preset: name,
      filters: presets[name],
      ...results
    });
    
  } catch (error) {
    console.error('[Stock Screener API] Error running preset:', error);
    res.status(500).json({
      error: 'Failed to run preset screen',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
