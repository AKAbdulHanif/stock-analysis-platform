import { Router } from 'express';
import { getDb } from '../db';
import { portfolioSnapshots, portfolios, benchmarkData } from '../../drizzle/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

const router = Router();

// Helper to get user ID from request (placeholder)
const getUserId = (req: any): number => {
  // TODO: Get from req.session or JWT token
  return 1; // Placeholder user ID
};

// GET /api/portfolios/:id/history - Fetch portfolio snapshots
router.get('/portfolios/:id/history', async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolioId = parseInt(req.params.id);
    const period = req.query.period as string || '1M'; // 1W, 1M, 3M, 6M, 1Y, ALL
    
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    // Verify ownership
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '1W':
        startDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'ALL':
        startDate = new Date(portfolio.createdAt);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }
    
    // Fetch snapshots
    const snapshots = await db
      .select()
      .from(portfolioSnapshots)
      .where(and(
        eq(portfolioSnapshots.portfolioId, portfolioId),
        gte(portfolioSnapshots.date, startDate)
      ))
      .orderBy(portfolioSnapshots.date);
    
    // Fetch S&P 500 benchmark data for the same period
    const benchmarkSnapshots = await db
      .select()
      .from(benchmarkData)
      .where(and(
        eq(benchmarkData.ticker, '^GSPC'),
        gte(benchmarkData.date, startDate)
      ))
      .orderBy(benchmarkData.date);
    
    res.json({
      portfolio: snapshots.map(s => ({
        date: s.date,
        value: parseFloat(s.totalValue),
        return: s.totalReturn ? parseFloat(s.totalReturn) : 0,
        returnPercent: s.totalReturnPercent ? parseFloat(s.totalReturnPercent) : 0,
      })),
      benchmark: benchmarkSnapshots.map(b => ({
        date: b.date,
        value: parseFloat(b.closePrice),
        dailyReturn: b.dailyReturn ? parseFloat(b.dailyReturn) : 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching portfolio history:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio history' });
  }
});

// POST /api/portfolios/:id/snapshot - Create a portfolio snapshot
router.post('/portfolios/:id/snapshot', async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolioId = parseInt(req.params.id);
    const { totalValue, totalReturn, totalReturnPercent, positions } = req.body;
    
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    // Verify ownership
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    // Create snapshot
    await db.insert(portfolioSnapshots).values({
      portfolioId,
      date: new Date(),
      totalValue: totalValue.toString(),
      totalReturn: totalReturn.toString(),
      totalReturnPercent: totalReturnPercent.toString(),
      positionsJson: JSON.stringify(positions),
    });
    
    res.json({ success: true, message: 'Snapshot created successfully' });
  } catch (error) {
    console.error('Error creating portfolio snapshot:', error);
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
});

// GET /api/portfolios/:id/performance - Calculate performance metrics
router.get('/portfolios/:id/performance', async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolioId = parseInt(req.params.id);
    
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    // Verify ownership
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    // Fetch all snapshots
    const snapshots = await db
      .select()
      .from(portfolioSnapshots)
      .where(eq(portfolioSnapshots.portfolioId, portfolioId))
      .orderBy(desc(portfolioSnapshots.date));
    
    if (snapshots.length === 0) {
      return res.json({
        totalReturn: 0,
        totalReturnPercent: 0,
        cagr: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
      });
    }
    
    const latestSnapshot = snapshots[0];
    const firstSnapshot = snapshots[snapshots.length - 1];
    
    // Calculate metrics
    const totalReturn = parseFloat(latestSnapshot.totalReturn || '0');
    const totalReturnPercent = parseFloat(latestSnapshot.totalReturnPercent || '0');
    
    // Calculate CAGR (Compound Annual Growth Rate)
    const daysDiff = Math.max(1, Math.floor((new Date(latestSnapshot.date).getTime() - new Date(firstSnapshot.date).getTime()) / (1000 * 60 * 60 * 24)));
    const years = daysDiff / 365;
    const initialValue = parseFloat(firstSnapshot.totalValue);
    const finalValue = parseFloat(latestSnapshot.totalValue);
    const cagr = years > 0 ? (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100 : 0;
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = parseFloat(snapshots[snapshots.length - 1].totalValue);
    
    for (let i = snapshots.length - 1; i >= 0; i--) {
      const value = parseFloat(snapshots[i].totalValue);
      if (value > peak) {
        peak = value;
      }
      const drawdown = ((peak - value) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    // Calculate Sharpe Ratio (simplified)
    const returns = [];
    for (let i = 0; i < snapshots.length - 1; i++) {
      const currentValue = parseFloat(snapshots[i].totalValue);
      const previousValue = parseFloat(snapshots[i + 1].totalValue);
      const dailyReturn = (currentValue - previousValue) / previousValue;
      returns.push(dailyReturn);
    }
    
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 0 ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
    
    res.json({
      totalReturn,
      totalReturnPercent,
      cagr: parseFloat(cagr.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
    });
  } catch (error) {
    console.error('Error calculating portfolio performance:', error);
    res.status(500).json({ error: 'Failed to calculate performance' });
  }
});

export default router;
