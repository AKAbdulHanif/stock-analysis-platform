import express from 'express';
import { SECTORS, getSecuritiesBySector } from '../../shared/stockUniverse';
import { getChartData, getStockQuote } from '../services/yahooFinanceService';

const router = express.Router();

interface SectorComparisonData {
  sector: string;
  historicalPerformance: Array<{ date: string; value: number }>;
  currentReturn: number;
  volatility: number;
  momentum: string;
}

// Calculate correlation between two arrays
function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;

  const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  if (denomX === 0 || denomY === 0) return 0;
  return numerator / Math.sqrt(denomX * denomY);
}

// GET /api/sector-comparison
router.get('/sector-comparison', async (req, res) => {
  try {
    const { sectors: sectorsParam, period = '3mo' } = req.query;
    
    // Parse sectors from query param
    const selectedSectors = sectorsParam 
      ? (sectorsParam as string).split(',').filter(s => SECTORS.includes(s))
      : SECTORS.slice(0, 3); // Default to first 3 sectors

    if (selectedSectors.length === 0) {
      return res.status(400).json({ error: 'No valid sectors selected' });
    }

    // Fetch data for each sector
    const sectorDataPromises = selectedSectors.map(async (sector) => {
      const stocks = getSecuritiesBySector(sector);
      
      // Sample 5 stocks from each sector for performance calculation
      const sampleStocks = stocks.slice(0, Math.min(5, stocks.length));
      
      // Get historical data for sample stocks
      const historicalPromises = sampleStocks.map(stock => 
        getChartData(stock.ticker, period as string, '1d').catch(() => null)
      );
      
      const historicalDataSets = await Promise.all(historicalPromises);
      const validDataSets = historicalDataSets.filter(d => d && d.length > 0);

      if (validDataSets.length === 0) {
        return null;
      }

      // Calculate average sector performance over time
      const dataLength = Math.min(...validDataSets.map(d => d!.length));
      const historicalPerformance: Array<{ date: string; value: number }> = [];

      for (let i = 0; i < dataLength; i++) {
        const date = validDataSets[0]![i].date;
        const avgClose = validDataSets.reduce((sum, dataSet) => {
          return sum + (dataSet![i]?.close || 0);
        }, 0) / validDataSets.length;

        // Normalize to percentage change from first day
        const firstDayAvg = validDataSets.reduce((sum, dataSet) => {
          return sum + (dataSet![0]?.close || 0);
        }, 0) / validDataSets.length;

        const percentChange = ((avgClose - firstDayAvg) / firstDayAvg) * 100;

        historicalPerformance.push({
          date,
          value: percentChange,
        });
      }

      // Calculate current return and volatility
      const returns = [];
      for (let i = 1; i < historicalPerformance.length; i++) {
        const dailyReturn = historicalPerformance[i].value - historicalPerformance[i - 1].value;
        returns.push(dailyReturn);
      }

      const currentReturn = historicalPerformance[historicalPerformance.length - 1]?.value || 0;
      const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance);

      // Determine momentum
      const recentReturns = returns.slice(-10);
      const avgRecentReturn = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
      let momentum = 'moderate';
      if (avgRecentReturn > 0.5) momentum = 'strong';
      else if (avgRecentReturn < -0.5) momentum = 'negative';
      else if (avgRecentReturn > 0) momentum = 'weak';

      return {
        sector,
        historicalPerformance,
        currentReturn,
        volatility,
        momentum,
      };
    });

    const sectorData = (await Promise.all(sectorDataPromises)).filter(d => d !== null) as SectorComparisonData[];

    // Calculate correlation matrix
    const correlationMatrix: Record<string, Record<string, number>> = {};
    
    for (let i = 0; i < sectorData.length; i++) {
      const sector1 = sectorData[i].sector;
      correlationMatrix[sector1] = {};

      for (let j = 0; j < sectorData.length; j++) {
        const sector2 = sectorData[j].sector;
        
        if (i === j) {
          correlationMatrix[sector1][sector2] = 1.0;
        } else {
          const values1 = sectorData[i].historicalPerformance.map(d => d.value);
          const values2 = sectorData[j].historicalPerformance.map(d => d.value);
          const correlation = calculateCorrelation(values1, values2);
          correlationMatrix[sector1][sector2] = correlation;
        }
      }
    }

    // Identify sector rotation signals
    const rotationSignals = sectorData.map(sector => {
      const recentPerf = sector.historicalPerformance.slice(-30);
      const trend = recentPerf[recentPerf.length - 1].value - recentPerf[0].value;
      
      let signal = 'Hold';
      if (trend > 2 && sector.momentum === 'strong') signal = 'Buy';
      else if (trend < -2 && sector.momentum === 'negative') signal = 'Sell';
      else if (trend > 0 && sector.volatility < 2) signal = 'Accumulate';

      return {
        sector: sector.sector,
        signal,
        trend,
        momentum: sector.momentum,
      };
    });

    res.json({
      sectors: sectorData,
      correlationMatrix,
      rotationSignals,
      period,
    });
  } catch (error) {
    console.error('Error fetching sector comparison:', error);
    res.status(500).json({ error: 'Failed to fetch sector comparison data' });
  }
});

export default router;
