/**
 * Candlestick Data Generation - Creates realistic OHLC (Open, High, Low, Close) data
 * for technical analysis and charting
 */

export interface CandleData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  sma20: number | null; // 20-period Simple Moving Average
  sma50: number | null; // 50-period Simple Moving Average
  rsi: number | null; // Relative Strength Index
  macd: number | null; // MACD
  bollingerUpper: number | null;
  bollingerLower: number | null;
}

/**
 * Generate realistic candlestick data with price movements
 */
export function generateCandleData(
  basePrice: number,
  periods: number = 48, // 48 periods = 4 hours at 5-min intervals
  volatility: number = 0.015
): CandleData[] {
  const candles: CandleData[] = [];
  let currentPrice = basePrice;
  const now = new Date();

  for (let i = periods - 1; i >= 0; i--) {
    // Generate OHLC for this period
    const open = currentPrice;
    
    // Random walk for price movement
    const change = (Math.random() - 0.5) * 2 * volatility;
    const close = open * (1 + change);
    
    // High and low with some randomness
    const range = Math.abs(close - open) * (0.5 + Math.random() * 1.5);
    const high = Math.max(open, close) + range * Math.random();
    const low = Math.min(open, close) - range * Math.random();
    
    // Volume with some variation
    const baseVolume = 1000000;
    const volume = Math.floor(baseVolume * (0.5 + Math.random() * 1.5));

    // Time calculation (5-minute intervals)
    const candleTime = new Date(now.getTime() - i * 5 * 60 * 1000);

    candles.push({
      time: candleTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: candleTime.getTime(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });

    currentPrice = close;
  }

  return candles;
}

/**
 * Generate daily candlestick data for longer-term analysis
 */
export function generateDailyCandleData(
  basePrice: number,
  days: number = 30,
  volatility: number = 0.025
): CandleData[] {
  const candles: CandleData[] = [];
  let currentPrice = basePrice;
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const open = currentPrice;
    
    // Daily volatility
    const change = (Math.random() - 0.5) * 2 * volatility;
    const close = open * (1 + change);
    
    // Intraday range
    const range = Math.abs(close - open) * (0.5 + Math.random() * 2);
    const high = Math.max(open, close) + range;
    const low = Math.min(open, close) - range;
    
    // Daily volume
    const baseVolume = 5000000;
    const volume = Math.floor(baseVolume * (0.5 + Math.random() * 1.5));

    // Date calculation
    const candleDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

    candles.push({
      time: candleDate.toLocaleDateString([], { month: "short", day: "numeric" }),
      timestamp: candleDate.getTime(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });

    currentPrice = close;
  }

  return candles;
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(parseFloat((sum / period).toFixed(2)));
    }
  }
  
  return sma;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const changes = prices.map((price, i) => (i === 0 ? 0 : price - prices[i - 1]));
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    if (changes[i] > 0) gains += changes[i];
    else losses += Math.abs(changes[i]);
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  for (let i = 0; i < period; i++) {
    rsi.push(NaN);
  }
  
  // Calculate RSI for remaining periods
  for (let i = period; i < prices.length; i++) {
    const change = changes[i];
    
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
    
    const rs = avgGain / avgLoss;
    const rsiValue = 100 - 100 / (1 + rs);
    rsi.push(parseFloat(rsiValue.toFixed(2)));
  }
  
  return rsi;
}

/**
 * Calculate Bollinger Bands
 */
function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDevs: number = 2
): { upper: number[]; lower: number[] } {
  const sma = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      
      upper.push(parseFloat((sma[i]! + stdDevs * stdDev).toFixed(2)));
      lower.push(parseFloat((sma[i]! - stdDevs * stdDev).toFixed(2)));
    }
  }
  
  return { upper, lower };
}

/**
 * Calculate technical indicators for candlestick data
 */
export function calculateTechnicalIndicators(
  candles: CandleData[]
): TechnicalIndicators[] {
  const closePrices = candles.map((c) => c.close);
  
  const sma20 = calculateSMA(closePrices, 20);
  const sma50 = calculateSMA(closePrices, 50);
  const rsi = calculateRSI(closePrices, 14);
  const { upper: bollingerUpper, lower: bollingerLower } = calculateBollingerBands(closePrices, 20);
  
  return candles.map((_, i) => ({
    sma20: sma20[i] || null,
    sma50: sma50[i] || null,
    rsi: rsi[i] || null,
    macd: null, // Can be implemented if needed
    bollingerUpper: bollingerUpper[i] || null,
    bollingerLower: bollingerLower[i] || null
  }));
}

/**
 * Get price statistics from candlestick data
 */
export function getPriceStats(candles: CandleData[]) {
  if (candles.length === 0) {
    return { high: 0, low: 0, change: 0, changePercent: 0 };
  }

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const high = Math.max(...highs);
  const low = Math.min(...lows);
  const open = candles[0].open;
  const close = candles[candles.length - 1].close;
  const change = close - open;
  const changePercent = (change / open) * 100;

  return {
    high: parseFloat(high.toFixed(2)),
    low: parseFloat(low.toFixed(2)),
    open: parseFloat(open.toFixed(2)),
    close: parseFloat(close.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2))
  };
}
