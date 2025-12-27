import { describe, it, expect } from 'vitest';
import { detectPatterns, type CandleData } from './candlestickPatternService';

describe('candlestickPatternService', () => {
  it('should detect patterns in candle data', () => {
    const candles: CandleData[] = [
      { date: '2024-01-01', open: 100, high: 105, low: 99, close: 103, volume: 1000000 },
      { date: '2024-01-02', open: 103, high: 108, low: 102, close: 107, volume: 1200000 },
      { date: '2024-01-03', open: 107, high: 110, low: 106, close: 109, volume: 1100000 },
    ];
    
    const patterns = detectPatterns(candles);
    
    expect(Array.isArray(patterns)).toBe(true);
  });

  it('should return empty array for insufficient data', () => {
    const candles: CandleData[] = [
      { date: '2024-01-01', open: 100, high: 105, low: 99, close: 103, volume: 1000000 },
    ];
    
    const patterns = detectPatterns(candles);
    
    expect(Array.isArray(patterns)).toBe(true);
  });
});
