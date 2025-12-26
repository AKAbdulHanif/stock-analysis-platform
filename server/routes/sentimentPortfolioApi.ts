/**
 * Sentiment Portfolio API
 * 
 * Provides endpoints for sentiment-adjusted portfolio recommendations
 */

import express from 'express';
import { calculateBatchSentimentScores, calculateSentimentWeight, getSentimentRanking } from '../services/sentimentScoringService';

const router = express.Router();

/**
 * GET /api/sentiment/portfolio/:portfolioId
 * Get sentiment-adjusted portfolio with updated allocations
 */
router.get('/portfolio/:portfolioId', async (req, res) => {
  try {
    const { portfolioId } = req.params;
    
    // Import portfolio data (would normally come from database)
    const { CONSERVATIVE_PORTFOLIO, MODERATE_PORTFOLIO, AGGRESSIVE_PORTFOLIO } = await import('../../client/src/data/portfolios');
    
    let portfolio;
    if (portfolioId === 'conservative') {
      portfolio = CONSERVATIVE_PORTFOLIO;
    } else if (portfolioId === 'moderate') {
      portfolio = MODERATE_PORTFOLIO;
    } else if (portfolioId === 'aggressive') {
      portfolio = AGGRESSIVE_PORTFOLIO;
    } else {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Get all stock tickers from portfolio
    const tickers = portfolio.stocks.map(s => s.ticker);

    // Calculate sentiment scores for all stocks
    const sentimentScores = await calculateBatchSentimentScores(tickers);

    // Calculate sentiment-adjusted allocations
    const adjustedStocks = portfolio.stocks.map(stock => {
      const sentimentScore = sentimentScores.get(stock.ticker);
      const sentimentWeight = sentimentScore ? calculateSentimentWeight(sentimentScore) : 1.0;
      
      return {
        ...stock,
        sentiment: sentimentScore,
        sentimentWeight,
        originalAllocation: stock.allocation,
        adjustedAllocation: stock.allocation * sentimentWeight,
      };
    });

    // Normalize adjusted allocations to sum to 100%
    const totalAdjusted = adjustedStocks.reduce((sum, s) => sum + s.adjustedAllocation, 0);
    const normalizedStocks = adjustedStocks.map(stock => ({
      ...stock,
      adjustedAllocation: (stock.adjustedAllocation / totalAdjusted) * 100,
    }));

    // Calculate portfolio-level sentiment metrics
    const avgSentiment = Array.from(sentimentScores.values())
      .reduce((sum, s) => sum + s.currentScore, 0) / sentimentScores.size;
    
    const improvingCount = Array.from(sentimentScores.values())
      .filter(s => s.momentum === 'improving').length;
    
    const decliningCount = Array.from(sentimentScores.values())
      .filter(s => s.momentum === 'declining').length;

    res.json({
      portfolio: {
        ...portfolio,
        stocks: normalizedStocks,
      },
      sentimentMetrics: {
        averageSentiment: avgSentiment,
        improvingStocks: improvingCount,
        decliningStocks: improvingCount,
        totalStocks: sentimentScores.size,
      },
    });
  } catch (error) {
    console.error('Error fetching sentiment portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment portfolio' });
  }
});

/**
 * GET /api/sentiment/ranking
 * Get sentiment-based stock ranking
 */
router.get('/ranking', async (req, res) => {
  try {
    const { tickers } = req.query;
    
    if (!tickers || typeof tickers !== 'string') {
      return res.status(400).json({ error: 'Tickers parameter required' });
    }

    const tickerArray = tickers.split(',').map(t => t.trim());
    const ranking = await getSentimentRanking(tickerArray);

    res.json({ ranking });
  } catch (error) {
    console.error('Error fetching sentiment ranking:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment ranking' });
  }
});

/**
 * POST /api/sentiment/rebalance
 * Get rebalancing recommendations based on sentiment changes
 */
router.post('/rebalance', async (req, res) => {
  try {
    const { currentHoldings } = req.body;

    if (!currentHoldings || !Array.isArray(currentHoldings)) {
      return res.status(400).json({ error: 'Current holdings required' });
    }

    // Calculate sentiment scores for current holdings
    const tickers = currentHoldings.map((h: any) => h.ticker);
    const sentimentScores = await calculateBatchSentimentScores(tickers);

    // Generate rebalancing recommendations
    const recommendations = [];

    for (const holding of currentHoldings) {
      const sentimentScore = sentimentScores.get(holding.ticker);
      
      if (!sentimentScore) continue;

      // Recommend reducing positions with declining sentiment
      if (sentimentScore.momentum === 'declining' && sentimentScore.currentScore < -0.2) {
        recommendations.push({
          ticker: holding.ticker,
          action: 'reduce',
          reason: `Declining sentiment (${(sentimentScore.currentScore * 100).toFixed(1)}% negative)`,
          suggestedChange: -20, // Reduce by 20%
          sentiment: sentimentScore,
        });
      }

      // Recommend increasing positions with improving sentiment
      if (sentimentScore.momentum === 'improving' && sentimentScore.currentScore > 0.2) {
        recommendations.push({
          ticker: holding.ticker,
          action: 'increase',
          reason: `Improving sentiment (${(sentimentScore.currentScore * 100).toFixed(1)}% positive)`,
          suggestedChange: 20, // Increase by 20%
          sentiment: sentimentScore,
        });
      }

      // Recommend holding positions with stable sentiment
      if (sentimentScore.momentum === 'stable' && Math.abs(sentimentScore.currentScore) < 0.2) {
        recommendations.push({
          ticker: holding.ticker,
          action: 'hold',
          reason: 'Stable sentiment',
          suggestedChange: 0,
          sentiment: sentimentScore,
        });
      }
    }

    res.json({ recommendations });
  } catch (error) {
    console.error('Error generating rebalancing recommendations:', error);
    res.status(500).json({ error: 'Failed to generate rebalancing recommendations' });
  }
});

export default router;
