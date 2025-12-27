import express from 'express';
import { getChartData } from '../services/yahooFinanceService';
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  generateSignals,
  type PriceData,
  type TechnicalIndicatorsResult
} from '../services/technicalIndicatorsService';

const router = express.Router();

/**
 * GET /api/technical-indicators/:ticker
 * Calculate technical indicators for a stock
 */
router.get('/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { period = '3mo', interval = '1d' } = req.query;

    console.log(`[Technical Indicators API] Fetching data for ${ticker}`);

    // Fetch historical data from Yahoo Finance
    const chartData = await getChartData(
      ticker,
      period as any,
      interval as any
    );
    const historicalData = chartData.dataPoints;

    if (!historicalData || historicalData.length === 0) {
      return res.status(404).json({ error: 'No historical data found for ticker' });
    }

    // Convert to PriceData format
    const priceData: PriceData[] = historicalData.map(d => ({
      date: d.date,
      close: d.close,
      high: d.high,
      low: d.low,
      volume: d.volume
    }));

    // Calculate indicators
    const rsi = calculateRSI(priceData, 14);
    const macd = calculateMACD(priceData, 12, 26, 9);
    const bollingerBands = calculateBollingerBands(priceData, 20, 2);

    // Generate signals
    const { signals, consensus } = generateSignals(rsi, macd, bollingerBands);

    const result: TechnicalIndicatorsResult = {
      ticker: ticker.toUpperCase(),
      lastUpdated: new Date().toISOString(),
      rsi,
      macd,
      bollingerBands,
      signals,
      consensus: consensus as any
    };

    res.json(result);
  } catch (error) {
    console.error('[Technical Indicators API] Error:', error);
    res.status(500).json({ error: 'Failed to calculate technical indicators' });
  }
});

export default router;
