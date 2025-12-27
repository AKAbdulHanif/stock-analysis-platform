/**
 * Cache API Routes
 * 
 * Provides endpoints for cache management and statistics
 */

import { Router, Request, Response } from 'express';
import { 
  getCacheStats, 
  resetCacheStats,
  cacheDeletePattern,
  invalidateTickerCache 
} from '../services/cacheService';
import { checkRedisHealth, flushRedisCache } from '../_core/redis';

const router = Router();

/**
 * GET /api/cache/stats
 * Get cache statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = getCacheStats();
    const healthy = await checkRedisHealth();
    
    res.json({
      ...stats,
      healthy,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get cache statistics',
    });
  }
});

/**
 * POST /api/cache/reset-stats
 * Reset cache statistics
 */
router.post('/reset-stats', (req: Request, res: Response) => {
  try {
    resetCacheStats();
    res.json({
      success: true,
      message: 'Cache statistics reset successfully',
    });
  } catch (error) {
    console.error('Error resetting cache stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reset cache statistics',
    });
  }
});

/**
 * POST /api/cache/invalidate/:ticker
 * Invalidate cache for a specific ticker
 */
router.post('/invalidate/:ticker', async (req: Request, res: Response) => {
  try {
    const { ticker } = req.params;
    
    if (!ticker || ticker.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Ticker symbol is required',
      });
    }

    const deleted = await invalidateTickerCache(ticker.trim().toUpperCase());
    
    res.json({
      success: true,
      message: `Cache invalidated for ${ticker}`,
      keysDeleted: deleted,
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to invalidate cache',
    });
  }
});

/**
 * POST /api/cache/flush
 * Flush all cache data (admin endpoint - use with caution!)
 */
router.post('/flush', async (req: Request, res: Response) => {
  try {
    await flushRedisCache();
    resetCacheStats();
    
    res.json({
      success: true,
      message: 'All cache data flushed successfully',
    });
  } catch (error) {
    console.error('Error flushing cache:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to flush cache',
    });
  }
});

/**
 * GET /api/cache/health
 * Check Redis connection health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthy = await checkRedisHealth();
    
    res.json({
      healthy,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking cache health:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check cache health',
      healthy: false,
    });
  }
});

export default router;
