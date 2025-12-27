/**
 * Candlestick Pattern Recognition Service
 * Detects common candlestick patterns for technical analysis
 */

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DetectedPattern {
  date: string;
  pattern: string;
  type: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  description: string;
}

/**
 * Detect all candlestick patterns in historical data
 */
export function detectPatterns(candles: CandleData[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  for (let i = 2; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const prevPrev = candles[i - 2];

    // Detect various patterns
    const hammer = detectHammer(current, prev);
    if (hammer) patterns.push({ ...hammer, date: current.date });

    const shootingStar = detectShootingStar(current, prev);
    if (shootingStar) patterns.push({ ...shootingStar, date: current.date });

    const doji = detectDoji(current);
    if (doji) patterns.push({ ...doji, date: current.date });

    const engulfing = detectEngulfing(current, prev);
    if (engulfing) patterns.push({ ...engulfing, date: current.date });

    const morningStar = detectMorningStar(current, prev, prevPrev);
    if (morningStar) patterns.push({ ...morningStar, date: current.date });

    const eveningStar = detectEveningStar(current, prev, prevPrev);
    if (eveningStar) patterns.push({ ...eveningStar, date: current.date });
  }

  return patterns;
}

/**
 * Hammer Pattern - Bullish reversal
 * Small body at top, long lower shadow (2x body), minimal upper shadow
 */
function detectHammer(candle: CandleData, prev: CandleData): Omit<DetectedPattern, 'date'> | null {
  const body = Math.abs(candle.close - candle.open);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  const range = candle.high - candle.low;

  // Hammer criteria
  if (
    lowerShadow > body * 2 &&
    upperShadow < body * 0.3 &&
    body / range < 0.3 &&
    prev.close < prev.open // Previous candle was bearish
  ) {
    return {
      pattern: 'Hammer',
      type: 'bullish',
      confidence: 75,
      description: 'Bullish reversal signal. Long lower shadow indicates buying pressure after sell-off.'
    };
  }

  return null;
}

/**
 * Shooting Star Pattern - Bearish reversal
 * Small body at bottom, long upper shadow (2x body), minimal lower shadow
 */
function detectShootingStar(candle: CandleData, prev: CandleData): Omit<DetectedPattern, 'date'> | null {
  const body = Math.abs(candle.close - candle.open);
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
  const range = candle.high - candle.low;

  // Shooting star criteria
  if (
    upperShadow > body * 2 &&
    lowerShadow < body * 0.3 &&
    body / range < 0.3 &&
    prev.close > prev.open // Previous candle was bullish
  ) {
    return {
      pattern: 'Shooting Star',
      type: 'bearish',
      confidence: 75,
      description: 'Bearish reversal signal. Long upper shadow indicates selling pressure after rally.'
    };
  }

  return null;
}

/**
 * Doji Pattern - Indecision
 * Open and close are nearly equal (body < 0.1% of range)
 */
function detectDoji(candle: CandleData): Omit<DetectedPattern, 'date'> | null {
  const body = Math.abs(candle.close - candle.open);
  const range = candle.high - candle.low;

  if (range === 0) return null;

  // Doji criteria
  if (body / range < 0.05) {
    return {
      pattern: 'Doji',
      type: 'neutral',
      confidence: 60,
      description: 'Market indecision. Equal buying and selling pressure. Potential trend reversal.'
    };
  }

  return null;
}

/**
 * Bullish/Bearish Engulfing Pattern
 * Current candle completely engulfs the previous candle's body
 */
function detectEngulfing(candle: CandleData, prev: CandleData): Omit<DetectedPattern, 'date'> | null {
  const currentBullish = candle.close > candle.open;
  const prevBullish = prev.close > prev.open;

  // Bullish Engulfing
  if (
    currentBullish &&
    !prevBullish &&
    candle.open < prev.close &&
    candle.close > prev.open
  ) {
    return {
      pattern: 'Bullish Engulfing',
      type: 'bullish',
      confidence: 80,
      description: 'Strong bullish reversal. Current green candle engulfs previous red candle.'
    };
  }

  // Bearish Engulfing
  if (
    !currentBullish &&
    prevBullish &&
    candle.open > prev.close &&
    candle.close < prev.open
  ) {
    return {
      pattern: 'Bearish Engulfing',
      type: 'bearish',
      confidence: 80,
      description: 'Strong bearish reversal. Current red candle engulfs previous green candle.'
    };
  }

  return null;
}

/**
 * Morning Star Pattern - Bullish reversal
 * Three-candle pattern: bearish, small body, bullish
 */
function detectMorningStar(
  current: CandleData,
  middle: CandleData,
  first: CandleData
): Omit<DetectedPattern, 'date'> | null {
  const firstBearish = first.close < first.open;
  const middleSmall = Math.abs(middle.close - middle.open) < Math.abs(first.close - first.open) * 0.5;
  const currentBullish = current.close > current.open;

  if (
    firstBearish &&
    middleSmall &&
    currentBullish &&
    current.close > (first.open + first.close) / 2
  ) {
    return {
      pattern: 'Morning Star',
      type: 'bullish',
      confidence: 85,
      description: 'Strong bullish reversal pattern. Three-candle formation signaling trend change.'
    };
  }

  return null;
}

/**
 * Evening Star Pattern - Bearish reversal
 * Three-candle pattern: bullish, small body, bearish
 */
function detectEveningStar(
  current: CandleData,
  middle: CandleData,
  first: CandleData
): Omit<DetectedPattern, 'date'> | null {
  const firstBullish = first.close > first.open;
  const middleSmall = Math.abs(middle.close - middle.open) < Math.abs(first.close - first.open) * 0.5;
  const currentBearish = current.close < current.open;

  if (
    firstBullish &&
    middleSmall &&
    currentBearish &&
    current.close < (first.open + first.close) / 2
  ) {
    return {
      pattern: 'Evening Star',
      type: 'bearish',
      confidence: 85,
      description: 'Strong bearish reversal pattern. Three-candle formation signaling trend change.'
    };
  }

  return null;
}

/**
 * Get pattern statistics for a set of detected patterns
 */
export function getPatternStats(patterns: DetectedPattern[]) {
  const bullishCount = patterns.filter(p => p.type === 'bullish').length;
  const bearishCount = patterns.filter(p => p.type === 'bearish').length;
  const neutralCount = patterns.filter(p => p.type === 'neutral').length;

  return {
    total: patterns.length,
    bullish: bullishCount,
    bearish: bearishCount,
    neutral: neutralCount,
    sentiment: bullishCount > bearishCount ? 'bullish' : bearishCount > bullishCount ? 'bearish' : 'neutral'
  };
}
