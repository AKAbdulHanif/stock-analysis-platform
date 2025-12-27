import express from 'express';
import { SECTORS, getSecuritiesBySector } from '../../shared/stockUniverse';

const router = express.Router();

interface SectorPerformance {
  sector: string;
  avgReturn: number;
  volatility: number;
  topGainers: Array<{ ticker: string; name: string; change: number }>;
  topLosers: Array<{ ticker: string; name: string; change: number }>;
  stockCount: number;
  momentum: 'strong' | 'moderate' | 'weak' | 'negative';
}

// Generate realistic sector performance data based on 2026 market trends
function generateSectorPerformance(): SectorPerformance[] {
  const sectorData: Record<string, { avgReturn: number; volatility: number; momentum: 'strong' | 'moderate' | 'weak' | 'negative' }> = {
    'Information Technology': { avgReturn: 2.8, volatility: 1.2, momentum: 'strong' },
    'Health Care': { avgReturn: 1.5, volatility: 0.8, momentum: 'moderate' },
    'Financials': { avgReturn: 1.2, volatility: 1.0, momentum: 'moderate' },
    'Consumer Discretionary': { avgReturn: 0.8, volatility: 1.5, momentum: 'weak' },
    'Communication Services': { avgReturn: 0.5, volatility: 1.3, momentum: 'weak' },
    'Industrials': { avgReturn: 0.9, volatility: 0.9, momentum: 'moderate' },
    'Consumer Staples': { avgReturn: 0.4, volatility: 0.6, momentum: 'weak' },
    'Energy': { avgReturn: -0.3, volatility: 2.1, momentum: 'negative' },
    'Materials': { avgReturn: 0.6, volatility: 1.4, momentum: 'weak' },
    'Real Estate': { avgReturn: -0.5, volatility: 1.1, momentum: 'negative' },
    'Utilities': { avgReturn: 0.2, volatility: 0.7, momentum: 'weak' },
  };

  return SECTORS.map(sector => {
    const securities = getSecuritiesBySector(sector);
    const data = sectorData[sector] || { avgReturn: 0, volatility: 1.0, momentum: 'weak' as const };
    
    // Generate sample top gainers/losers
    const sampleStocks = securities.slice(0, 6);
    const topGainers = sampleStocks.slice(0, 3).map((s, i) => ({
      ticker: s.ticker,
      name: s.name,
      change: data.avgReturn + (2 - i * 0.5) + Math.random() * 0.5,
    }));
    
    const topLosers = sampleStocks.slice(3, 6).map((s, i) => ({
      ticker: s.ticker,
      name: s.name,
      change: data.avgReturn - (1 + i * 0.3) - Math.random() * 0.3,
    }));

    return {
      sector,
      avgReturn: data.avgReturn,
      volatility: data.volatility,
      topGainers,
      topLosers,
      stockCount: securities.length,
      momentum: data.momentum,
    };
  });
}

router.get('/sector-performance', async (req, res) => {
  try {
    const sectorPerformances = generateSectorPerformance();
    res.json(sectorPerformances);
  } catch (error) {
    console.error('Error fetching sector performance:', error);
    res.status(500).json({ error: 'Failed to fetch sector performance data' });
  }
});

export default router;
