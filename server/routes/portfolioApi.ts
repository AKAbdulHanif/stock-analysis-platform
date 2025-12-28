import express from 'express';
import { getDb } from '../db';
import { portfolios, portfolioPositions, type Portfolio, type InsertPortfolio, type PortfolioPosition, type InsertPortfolioPosition } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// Middleware to get userId from session/auth
// For now, we'll use a placeholder. In production, this would come from OAuth session
const getUserId = (req: express.Request): number => {
  // TODO: Get from req.session or JWT token
  return 1; // Placeholder user ID
};

// GET /api/portfolios - List all portfolios for the current user
router.get('/portfolios', async (req, res) => {
  try {
    const userId = getUserId(req);
    const db = await getDb();
    
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const userPortfolios = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId));
    
    // Get position counts for each portfolio
    const portfoliosWithCounts = await Promise.all(
      userPortfolios.map(async (portfolio) => {
        const positions = await db
          .select()
          .from(portfolioPositions)
          .where(eq(portfolioPositions.portfolioId, portfolio.id));
        
        return {
          ...portfolio,
          positionCount: positions.length,
        };
      })
    );
    
    res.json(portfoliosWithCounts);
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    res.status(500).json({ error: 'Failed to fetch portfolios' });
  }
});

// GET /api/portfolios/:id - Get a specific portfolio with positions
router.get('/portfolios/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolioId = parseInt(req.params.id);
    const db = await getDb();
    
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(and(
        eq(portfolios.id, portfolioId),
        eq(portfolios.userId, userId)
      ));
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    const positions = await db
      .select()
      .from(portfolioPositions)
      .where(eq(portfolioPositions.portfolioId, portfolioId));
    
    res.json({
      ...portfolio,
      positions: positions.map(p => ({
        id: p.id,
        ticker: p.ticker,
        shares: parseFloat(p.shares),
        avgCost: parseFloat(p.avgCost),
      })),
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// POST /api/portfolios - Create a new portfolio
router.post('/portfolios', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, description, positions } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Portfolio name is required' });
    }
    
    const db = await getDb();
    
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    // Create portfolio
    const [result] = await db.insert(portfolios).values({
      userId,
      name: name.trim(),
      description: description?.trim() || null,
    });
    
    const portfolioId = result.insertId;
    
    // Add positions if provided
    if (positions && Array.isArray(positions) && positions.length > 0) {
      const positionValues = positions.map((pos: any) => ({
        portfolioId,
        ticker: pos.ticker,
        shares: pos.shares.toString(),
        avgCost: pos.avgCost.toString(),
      }));
      
      await db.insert(portfolioPositions).values(positionValues);
    }
    
    // Fetch the created portfolio with positions
    const [createdPortfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId));
    
    const createdPositions = await db
      .select()
      .from(portfolioPositions)
      .where(eq(portfolioPositions.portfolioId, portfolioId));
    
    res.status(201).json({
      ...createdPortfolio,
      positions: createdPositions.map(p => ({
        id: p.id,
        ticker: p.ticker,
        shares: parseFloat(p.shares),
        avgCost: parseFloat(p.avgCost),
      })),
    });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    res.status(500).json({ error: 'Failed to create portfolio' });
  }
});

// PUT /api/portfolios/:id - Update a portfolio
router.put('/portfolios/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolioId = parseInt(req.params.id);
    const { name, description, positions } = req.body;
    const db = await getDb();
    
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    // Verify ownership
    const [existing] = await db
      .select()
      .from(portfolios)
      .where(and(
        eq(portfolios.id, portfolioId),
        eq(portfolios.userId, userId)
      ));
    
    if (!existing) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    // Update portfolio metadata
    if (name || description !== undefined) {
      await db
        .update(portfolios)
        .set({
          ...(name && { name: name.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
        })
        .where(eq(portfolios.id, portfolioId));
    }
    
    // Update positions if provided
    if (positions && Array.isArray(positions)) {
      // Delete existing positions
      await db
        .delete(portfolioPositions)
        .where(eq(portfolioPositions.portfolioId, portfolioId));
      
      // Insert new positions
      if (positions.length > 0) {
        const positionValues = positions.map((pos: any) => ({
          portfolioId,
          ticker: pos.ticker,
          shares: pos.shares.toString(),
          avgCost: pos.avgCost.toString(),
        }));
        
        await db.insert(portfolioPositions).values(positionValues);
      }
    }
    
    // Fetch updated portfolio
    const [updatedPortfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId));
    
    const updatedPositions = await db
      .select()
      .from(portfolioPositions)
      .where(eq(portfolioPositions.portfolioId, portfolioId));
    
    res.json({
      ...updatedPortfolio,
      positions: updatedPositions.map(p => ({
        id: p.id,
        ticker: p.ticker,
        shares: parseFloat(p.shares),
        avgCost: parseFloat(p.avgCost),
      })),
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({ error: 'Failed to update portfolio' });
  }
});

// DELETE /api/portfolios/:id - Delete a portfolio
router.delete('/portfolios/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolioId = parseInt(req.params.id);
    const db = await getDb();
    
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    // Verify ownership
    const [existing] = await db
      .select()
      .from(portfolios)
      .where(and(
        eq(portfolios.id, portfolioId),
        eq(portfolios.userId, userId)
      ));
    
    if (!existing) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    // Delete positions first (foreign key constraint)
    await db
      .delete(portfolioPositions)
      .where(eq(portfolioPositions.portfolioId, portfolioId));
    
    // Delete portfolio
    await db
      .delete(portfolios)
      .where(eq(portfolios.id, portfolioId));
    
    res.json({ success: true, message: 'Portfolio deleted successfully' });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    res.status(500).json({ error: 'Failed to delete portfolio' });
  }
});

export default router;
