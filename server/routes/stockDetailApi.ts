import express from 'express';
import { getChartData, getStockQuote } from '../services/yahooFinanceService';
import { calculateRSI, calculateMACD, calculateBollingerBands } from '../services/technicalIndicatorsService';

const router = express.Router();

// GET /api/stock/:ticker
router.get('/stock/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { period = '1mo', interval = '1d' } = req.query;

    // Fetch stock quote for current info
    const quote = await getStockQuote(ticker);
    
    // Fetch historical chart data
    const chartData = await getChartData(ticker, period as string, interval as string);

    if (!chartData || chartData.length === 0) {
      return res.status(404).json({ error: 'Stock data not found' });
    }

    // Calculate technical indicators
    const closes = chartData.map(d => d.close);
    const highs = chartData.map(d => d.high);
    const lows = chartData.map(d => d.low);

    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    const bollingerBands = calculateBollingerBands(closes, 20, 2);

    // Combine data with indicators
    const enrichedData = chartData.map((candle, index) => ({
      ...candle,
      rsi: rsi[index] || null,
      macd: macd.macd[index] || null,
      macdSignal: macd.signal[index] || null,
      macdHistogram: macd.histogram[index] || null,
      bollingerUpper: bollingerBands.upper[index] || null,
      bollingerMiddle: bollingerBands.middle[index] || null,
      bollingerLower: bollingerBands.lower[index] || null,
    }));

    res.json({
      ticker,
      quote,
      chartData: enrichedData,
      period,
      interval,
    });
  } catch (error) {
    console.error('Error fetching stock detail:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

export default router;
