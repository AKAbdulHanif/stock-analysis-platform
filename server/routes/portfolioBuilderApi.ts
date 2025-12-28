import express from 'express';
import { getStockQuote, getChartData } from '../services/yahooFinanceService';

const router = express.Router();

interface PortfolioPosition {
  ticker: string;
  shares: number;
  avgCost: number;
}

interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  totalReturnPercent: number;
  sharpeRatio: number;
  beta: number;
  diversificationScore: number;
  positions: Array<{
    ticker: string;
    shares: number;
    avgCost: number;
    currentPrice: number;
    value: number;
    return: number;
    returnPercent: number;
    weight: number;
  }>;
}

// Calculate portfolio metrics
async function calculatePortfolioMetrics(positions: PortfolioPosition[]): Promise<PortfolioMetrics> {
  // Fetch current prices for all positions
  const pricePromises = positions.map(pos => getStockQuote(pos.ticker).catch(() => null));
  const quotes = await Promise.all(pricePromises);

  let totalValue = 0;
  let totalCost = 0;
  const enrichedPositions = [];

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const quote = quotes[i];
    
    if (!quote) continue;

    const currentPrice = quote.price;
    const value = pos.shares * currentPrice;
    const cost = pos.shares * pos.avgCost;
    const posReturn = value - cost;
    const returnPercent = (posReturn / cost) * 100;

    totalValue += value;
    totalCost += cost;

    enrichedPositions.push({
      ticker: pos.ticker,
      shares: pos.shares,
      avgCost: pos.avgCost,
      currentPrice,
      value,
      return: posReturn,
      returnPercent,
      weight: 0, // Will be calculated after totalValue is known
    });
  }

  // Calculate weights
  enrichedPositions.forEach(pos => {
    pos.weight = (pos.value / totalValue) * 100;
  });

  const totalReturn = totalValue - totalCost;
  const totalReturnPercent = (totalReturn / totalCost) * 100;

  // Calculate Sharpe Ratio (simplified)
  // Fetch historical returns for each position
  const returnsPromises = positions.map(pos =>
    getChartData(pos.ticker, '1y', '1d')
      .then(data => {
        if (!data || data.length < 2) return [];
        const returns = [];
        for (let i = 1; i < data.length; i++) {
          const dailyReturn = (data[i].close - data[i - 1].close) / data[i - 1].close;
          returns.push(dailyReturn);
        }
        return returns;
      })
      .catch(() => [])
  );

  const allReturns = await Promise.all(returnsPromises);
  
  // Calculate portfolio returns (weighted average)
  const portfolioReturns: number[] = [];
  if (allReturns.length > 0 && allReturns[0].length > 0) {
    for (let i = 0; i < allReturns[0].length; i++) {
      let weightedReturn = 0;
      for (let j = 0; j < allReturns.length; j++) {
        if (allReturns[j][i] !== undefined) {
          const weight = enrichedPositions[j]?.weight || 0;
          weightedReturn += allReturns[j][i] * (weight / 100);
        }
      }
      portfolioReturns.push(weightedReturn);
    }
  }

  // Calculate Sharpe Ratio
  const avgReturn = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
  const variance = portfolioReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / portfolioReturns.length;
  const stdDev = Math.sqrt(variance);
  const riskFreeRate = 0.04 / 252; // Assume 4% annual risk-free rate, daily
  const sharpeRatio = stdDev > 0 ? ((avgReturn - riskFreeRate) / stdDev) * Math.sqrt(252) : 0;

  // Calculate Beta (simplified - assume market return is S&P 500)
  // For simplicity, we'll use a placeholder beta of 1.0
  const beta = 1.0;

  // Calculate Diversification Score (0-100)
  // Based on number of positions and weight distribution
  const numPositions = enrichedPositions.length;
  const maxWeight = Math.max(...enrichedPositions.map(p => p.weight));
  const diversificationScore = Math.min(100, (numPositions * 10) + (100 - maxWeight));

  return {
    totalValue,
    totalCost,
    totalReturn,
    totalReturnPercent,
    sharpeRatio,
    beta,
    diversificationScore,
    positions: enrichedPositions,
  };
}

// POST /api/portfolio/calculate
router.post('/portfolio/calculate', async (req, res) => {
  try {
    const { positions } = req.body as { positions: PortfolioPosition[] };

    if (!positions || positions.length === 0) {
      return res.status(400).json({ error: 'No positions provided' });
    }

    const metrics = await calculatePortfolioMetrics(positions);
    res.json(metrics);
  } catch (error) {
    console.error('Error calculating portfolio metrics:', error);
    res.status(500).json({ error: 'Failed to calculate portfolio metrics' });
  }
});

export default router;
