/**
 * Watchlist API Routes
 * 
 * Provides REST API endpoints for watchlist management
 */

import { Router, Request, Response } from 'express';
import {
  getUserWatchlists,
  getWatchlistById,
  createWatchlist,
  updateWatchlist,
  deleteWatchlist,
  getWatchlistStocks,
  addStockToWatchlist,
  removeStockFromWatchlist,
  WatchlistError,
} from '../services/watchlistService';

const router = Router();

/**
 * Middleware to extract userId from session/auth
 * In production, this would come from JWT or session
 * For now, we'll use a mock user ID or require it in headers
 */
function getUserId(req: Request): number | null {
  // TODO: Replace with actual auth middleware
  // For now, check for X-User-Id header (development only)
  const userIdHeader = req.headers['x-user-id'];
  if (userIdHeader) {
    return parseInt(userIdHeader as string, 10);
  }
  
  // In production, extract from JWT or session
  // const userId = req.user?.id;
  // return userId || null;
  
  return null;
}

/**
 * GET /api/watchlists
 * Get all watchlists for the current user
 */
router.get('/watchlists', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found. Please log in.',
      });
    }

    const watchlists = await getUserWatchlists(userId);
    res.json({ watchlists });
  } catch (error) {
    if (error instanceof WatchlistError) {
      return res.status(error.statusCode).json({
        error: error.name,
        message: error.message,
      });
    }
    
    console.error('Error fetching watchlists:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch watchlists',
    });
  }
});

/**
 * GET /api/watchlists/:id
 * Get a specific watchlist by ID
 */
router.get('/watchlists/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found. Please log in.',
      });
    }

    const watchlistId = parseInt(req.params.id, 10);
    if (isNaN(watchlistId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid watchlist ID',
      });
    }

    const watchlist = await getWatchlistById(watchlistId, userId);
    if (!watchlist) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Watchlist not found',
      });
    }

    res.json(watchlist);
  } catch (error) {
    if (error instanceof WatchlistError) {
      return res.status(error.statusCode).json({
        error: error.name,
        message: error.message,
      });
    }
    
    console.error('Error fetching watchlist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch watchlist',
    });
  }
});

/**
 * POST /api/watchlists
 * Create a new watchlist
 * Body: { name: string, description?: string }
 */
router.post('/watchlists', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found. Please log in.',
      });
    }

    const { name, description } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Watchlist name is required',
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Watchlist name must be 100 characters or less',
      });
    }

    const watchlist = await createWatchlist({
      userId,
      name: name.trim(),
      description: description?.trim() || null,
    });

    res.status(201).json(watchlist);
  } catch (error) {
    if (error instanceof WatchlistError) {
      return res.status(error.statusCode).json({
        error: error.name,
        message: error.message,
      });
    }
    
    console.error('Error creating watchlist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create watchlist',
    });
  }
});

/**
 * PUT /api/watchlists/:id
 * Update a watchlist
 * Body: { name?: string, description?: string }
 */
router.put('/watchlists/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found. Please log in.',
      });
    }

    const watchlistId = parseInt(req.params.id, 10);
    if (isNaN(watchlistId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid watchlist ID',
      });
    }

    const { name, description } = req.body;
    const updates: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Watchlist name must be a non-empty string',
        });
      }
      if (name.length > 100) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Watchlist name must be 100 characters or less',
        });
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No updates provided',
      });
    }

    const watchlist = await updateWatchlist(watchlistId, userId, updates);
    res.json(watchlist);
  } catch (error) {
    if (error instanceof WatchlistError) {
      return res.status(error.statusCode).json({
        error: error.name,
        message: error.message,
      });
    }
    
    console.error('Error updating watchlist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update watchlist',
    });
  }
});

/**
 * DELETE /api/watchlists/:id
 * Delete a watchlist
 */
router.delete('/watchlists/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found. Please log in.',
      });
    }

    const watchlistId = parseInt(req.params.id, 10);
    if (isNaN(watchlistId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid watchlist ID',
      });
    }

    await deleteWatchlist(watchlistId, userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof WatchlistError) {
      return res.status(error.statusCode).json({
        error: error.name,
        message: error.message,
      });
    }
    
    console.error('Error deleting watchlist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete watchlist',
    });
  }
});

/**
 * GET /api/watchlists/:id/stocks
 * Get all stocks in a watchlist
 */
router.get('/watchlists/:id/stocks', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found. Please log in.',
      });
    }

    const watchlistId = parseInt(req.params.id, 10);
    if (isNaN(watchlistId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid watchlist ID',
      });
    }

    const stocks = await getWatchlistStocks(watchlistId, userId);
    res.json({ stocks });
  } catch (error) {
    if (error instanceof WatchlistError) {
      return res.status(error.statusCode).json({
        error: error.name,
        message: error.message,
      });
    }
    
    console.error('Error fetching watchlist stocks:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch watchlist stocks',
    });
  }
});

/**
 * POST /api/watchlists/:id/stocks
 * Add a stock to a watchlist
 * Body: { ticker: string }
 */
router.post('/watchlists/:id/stocks', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found. Please log in.',
      });
    }

    const watchlistId = parseInt(req.params.id, 10);
    if (isNaN(watchlistId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid watchlist ID',
      });
    }

    const { ticker } = req.body;
    
    if (!ticker || typeof ticker !== 'string' || ticker.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Ticker symbol is required',
      });
    }

    if (ticker.length > 10) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Ticker symbol must be 10 characters or less',
      });
    }

    const stock = await addStockToWatchlist(watchlistId, userId, ticker);
    res.status(201).json(stock);
  } catch (error) {
    if (error instanceof WatchlistError) {
      return res.status(error.statusCode).json({
        error: error.name,
        message: error.message,
      });
    }
    
    console.error('Error adding stock to watchlist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add stock to watchlist',
    });
  }
});

/**
 * DELETE /api/watchlists/:id/stocks/:ticker
 * Remove a stock from a watchlist
 */
router.delete('/watchlists/:id/stocks/:ticker', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found. Please log in.',
      });
    }

    const watchlistId = parseInt(req.params.id, 10);
    if (isNaN(watchlistId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid watchlist ID',
      });
    }

    const { ticker } = req.params;
    if (!ticker || ticker.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Ticker symbol is required',
      });
    }

    await removeStockFromWatchlist(watchlistId, userId, ticker);
    res.status(204).send();
  } catch (error) {
    if (error instanceof WatchlistError) {
      return res.status(error.statusCode).json({
        error: error.name,
        message: error.message,
      });
    }
    
    console.error('Error removing stock from watchlist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove stock from watchlist',
    });
  }
});

export default router;
