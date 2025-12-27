/**
 * Technical Indicators Service
 * 
 * Calculates RSI, MACD, Bollinger Bands, and other technical indicators
 * for stock price analysis and signal detection.
 */

export interface PriceData {
  date: string;
  close: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface RSIResult {
  date: string;
  rsi: number;
  signal: 'oversold' | 'neutral' | 'overbought';
}

export interface MACDResult {
  date: string;
  macd: number;
  signal: number;
  histogram: number;
  crossover: 'bullish' | 'bearish' | 'none';
}

export interface BollingerBandsResult {
  date: string;
  upper: number;
  middle: number;
  lower: number;
  price: number;
  signal: 'buy' | 'sell' | 'neutral';
}

export interface TechnicalSignal {
  indicator: string;
  signal: 'buy' | 'sell' | 'neutral';
  strength: 'strong' | 'moderate' | 'weak';
  description: string;
}

export interface TechnicalIndicatorsResult {
  ticker: string;
  lastUpdated: string;
  rsi: RSIResult[];
  macd: MACDResult[];
  bollingerBands: BollingerBandsResult[];
  signals: TechnicalSignal[];
  consensus: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
}

/**
 * Calculate Simple Moving Average (SMA)
 */
function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  
  return sma;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema[period - 1] = sum / period;
  
  // Calculate EMA for remaining data
  for (let i = period; i < data.length; i++) {
    ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }
  
  // Fill initial values with NaN
  for (let i = 0; i < period - 1; i++) {
    ema[i] = NaN;
  }
  
  return ema;
}

/**
 * Calculate RSI (Relative Strength Index)
 * Default period: 14
 */
export function calculateRSI(prices: PriceData[], period: number = 14): RSIResult[] {
  const results: RSIResult[] = [];
  
  if (prices.length < period + 1) {
    return results;
  }
  
  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i].close - prices[i - 1].close);
  }
  
  // Separate gains and losses
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
  
  // Calculate average gain and loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  // Calculate RSI for first period
  let rs = avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));
  
  results.push({
    date: prices[period].date,
    rsi: rsi,
    signal: rsi < 30 ? 'oversold' : rsi > 70 ? 'overbought' : 'neutral'
  });
  
  // Calculate RSI for remaining periods using smoothed averages
  for (let i = period + 1; i < prices.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
    
    rs = avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
    
    results.push({
      date: prices[i].date,
      rsi: rsi,
      signal: rsi < 30 ? 'oversold' : rsi > 70 ? 'overbought' : 'neutral'
    });
  }
  
  return results;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * Default periods: 12, 26, 9
 */
export function calculateMACD(
  prices: PriceData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult[] {
  const results: MACDResult[] = [];
  
  if (prices.length < slowPeriod + signalPeriod) {
    return results;
  }
  
  const closes = prices.map(p => p.close);
  
  // Calculate EMAs
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);
  
  // Calculate MACD line
  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // Calculate signal line (EMA of MACD)
  const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), signalPeriod);
  
  // Align signal line with MACD line
  const alignedSignalLine: number[] = [];
  let signalIndex = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i])) {
      alignedSignalLine.push(NaN);
    } else {
      if (signalIndex < signalLine.length && !isNaN(signalLine[signalIndex])) {
        alignedSignalLine.push(signalLine[signalIndex]);
        signalIndex++;
      } else {
        alignedSignalLine.push(NaN);
      }
    }
  }
  
  // Generate results with crossover detection
  let prevHistogram = 0;
  for (let i = slowPeriod + signalPeriod; i < prices.length; i++) {
    if (isNaN(macdLine[i]) || isNaN(alignedSignalLine[i])) continue;
    
    const histogram = macdLine[i] - alignedSignalLine[i];
    
    let crossover: 'bullish' | 'bearish' | 'none' = 'none';
    if (i > slowPeriod + signalPeriod) {
      if (prevHistogram < 0 && histogram > 0) {
        crossover = 'bullish';
      } else if (prevHistogram > 0 && histogram < 0) {
        crossover = 'bearish';
      }
    }
    
    results.push({
      date: prices[i].date,
      macd: macdLine[i],
      signal: alignedSignalLine[i],
      histogram: histogram,
      crossover: crossover
    });
    
    prevHistogram = histogram;
  }
  
  return results;
}

/**
 * Calculate Bollinger Bands
 * Default period: 20, stdDev: 2
 */
export function calculateBollingerBands(
  prices: PriceData[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsResult[] {
  const results: BollingerBandsResult[] = [];
  
  if (prices.length < period) {
    return results;
  }
  
  const closes = prices.map(p => p.close);
  const sma = calculateSMA(closes, period);
  
  for (let i = period - 1; i < prices.length; i++) {
    if (isNaN(sma[i])) continue;
    
    // Calculate standard deviation
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = sma[i];
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    
    const upper = mean + (stdDev * sd);
    const lower = mean - (stdDev * sd);
    const price = closes[i];
    
    // Determine signal
    let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
    const lowerThreshold = lower + (upper - lower) * 0.1; // 10% above lower band
    const upperThreshold = upper - (upper - lower) * 0.1; // 10% below upper band
    
    if (price <= lowerThreshold) {
      signal = 'buy';
    } else if (price >= upperThreshold) {
      signal = 'sell';
    }
    
    results.push({
      date: prices[i].date,
      upper: upper,
      middle: mean,
      lower: lower,
      price: price,
      signal: signal
    });
  }
  
  return results;
}

/**
 * Generate trading signals from technical indicators
 */
export function generateSignals(
  rsi: RSIResult[],
  macd: MACDResult[],
  bollingerBands: BollingerBandsResult[]
): { signals: TechnicalSignal[]; consensus: string } {
  const signals: TechnicalSignal[] = [];
  
  // Get latest values
  const latestRSI = rsi[rsi.length - 1];
  const latestMACD = macd[macd.length - 1];
  const latestBB = bollingerBands[bollingerBands.length - 1];
  
  // RSI Signal
  if (latestRSI) {
    if (latestRSI.rsi < 30) {
      signals.push({
        indicator: 'RSI',
        signal: 'buy',
        strength: latestRSI.rsi < 20 ? 'strong' : 'moderate',
        description: `RSI at ${latestRSI.rsi.toFixed(2)} indicates oversold conditions`
      });
    } else if (latestRSI.rsi > 70) {
      signals.push({
        indicator: 'RSI',
        signal: 'sell',
        strength: latestRSI.rsi > 80 ? 'strong' : 'moderate',
        description: `RSI at ${latestRSI.rsi.toFixed(2)} indicates overbought conditions`
      });
    } else {
      signals.push({
        indicator: 'RSI',
        signal: 'neutral',
        strength: 'weak',
        description: `RSI at ${latestRSI.rsi.toFixed(2)} is in neutral range`
      });
    }
  }
  
  // MACD Signal
  if (latestMACD) {
    if (latestMACD.crossover === 'bullish') {
      signals.push({
        indicator: 'MACD',
        signal: 'buy',
        strength: 'strong',
        description: 'MACD bullish crossover detected'
      });
    } else if (latestMACD.crossover === 'bearish') {
      signals.push({
        indicator: 'MACD',
        signal: 'sell',
        strength: 'strong',
        description: 'MACD bearish crossover detected'
      });
    } else if (latestMACD.histogram > 0) {
      signals.push({
        indicator: 'MACD',
        signal: 'buy',
        strength: 'weak',
        description: 'MACD histogram is positive'
      });
    } else if (latestMACD.histogram < 0) {
      signals.push({
        indicator: 'MACD',
        signal: 'sell',
        strength: 'weak',
        description: 'MACD histogram is negative'
      });
    }
  }
  
  // Bollinger Bands Signal
  if (latestBB) {
    if (latestBB.signal === 'buy') {
      signals.push({
        indicator: 'Bollinger Bands',
        signal: 'buy',
        strength: 'moderate',
        description: 'Price near lower Bollinger Band'
      });
    } else if (latestBB.signal === 'sell') {
      signals.push({
        indicator: 'Bollinger Bands',
        signal: 'sell',
        strength: 'moderate',
        description: 'Price near upper Bollinger Band'
      });
    } else {
      signals.push({
        indicator: 'Bollinger Bands',
        signal: 'neutral',
        strength: 'weak',
        description: 'Price within Bollinger Bands'
      });
    }
  }
  
  // Calculate consensus
  const buySignals = signals.filter(s => s.signal === 'buy');
  const sellSignals = signals.filter(s => s.signal === 'sell');
  const strongBuy = buySignals.filter(s => s.strength === 'strong').length;
  const strongSell = sellSignals.filter(s => s.strength === 'strong').length;
  
  let consensus: string;
  if (strongBuy >= 2 || buySignals.length >= 3) {
    consensus = 'strong_buy';
  } else if (buySignals.length > sellSignals.length) {
    consensus = 'buy';
  } else if (strongSell >= 2 || sellSignals.length >= 3) {
    consensus = 'strong_sell';
  } else if (sellSignals.length > buySignals.length) {
    consensus = 'sell';
  } else {
    consensus = 'neutral';
  }
  
  return { signals, consensus };
}
