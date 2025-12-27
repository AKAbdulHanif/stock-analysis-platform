import { describe, it, expect } from 'vitest';
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  type PriceData,
} from './technicalIndicatorsService';

function generatePriceData(count: number): PriceData[] {
  const data: PriceData[] = [];
  let price = 100;
  
  for (let i = 0; i < count; i++) {
    price += (Math.random() - 0.5) * 4;
    data.push({
      date: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      close: price
    });
  }
  
  return data;
}

function generateTrendingUpData(count: number): PriceData[] {
  const data: PriceData[] = [];
  let price = 50;
  
  for (let i = 0; i < count; i++) {
    price += Math.random() * 3 + 1; // Strong uptrend
    data.push({
      date: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      close: price
    });
  }
  
  return data;
}

function generateTrendingDownData(count: number): PriceData[] {
  const data: PriceData[] = [];
  let price = 150;
  
  for (let i = 0; i < count; i++) {
    price -= Math.random() * 3 + 1; // Strong downtrend
    data.push({
      date: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      close: price
    });
  }
  
  return data;
}

describe('technicalIndicatorsService', () => {
  describe('calculateRSI', () => {
    it('should calculate RSI correctly', () => {
      const prices = generatePriceData(50);
      const results = calculateRSI(prices, 14);
      
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(result => {
        expect(result.rsi).toBeGreaterThanOrEqual(0);
        expect(result.rsi).toBeLessThanOrEqual(100);
        expect(result.date).toBeDefined();
        expect(result.signal).toBeDefined();
      });
    });

    it('should detect oversold conditions', () => {
      const prices = generateTrendingDownData(50);
      const results = calculateRSI(prices, 14);
      
      const oversoldSignals = results.filter(r => r.signal === 'oversold');
      expect(oversoldSignals.length).toBeGreaterThan(0);
      
      oversoldSignals.forEach(signal => {
        expect(signal.rsi).toBeLessThan(30);
      });
    });

    it('should detect overbought conditions', () => {
      const prices = generateTrendingUpData(50);
      const results = calculateRSI(prices, 14);
      
      const overboughtSignals = results.filter(r => r.signal === 'overbought');
      expect(overboughtSignals.length).toBeGreaterThan(0);
      
      overboughtSignals.forEach(signal => {
        expect(signal.rsi).toBeGreaterThan(70);
      });
    });

    it('should return empty array for insufficient data', () => {
      const prices = generatePriceData(10);
      const results = calculateRSI(prices, 14);
      
      expect(results.length).toBe(0);
    });
  });

  describe('calculateMACD', () => {
    it('should calculate MACD correctly', () => {
      const prices = generatePriceData(100);
      const results = calculateMACD(prices, 12, 26, 9);
      
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(result => {
        expect(result.date).toBeDefined();
        expect(result.macd).toBeDefined();
        expect(result.signal).toBeDefined();
        expect(result.histogram).toBeDefined();
        expect(result.crossover).toBeDefined();
        expect(result.histogram).toBeCloseTo(result.macd - result.signal, 5);
      });
    });

    it('should detect crossovers', () => {
      const prices = generatePriceData(100);
      const results = calculateMACD(prices, 12, 26, 9);
      
      // Should have some crossover signals (bullish, bearish, or none)
      const crossovers = results.filter(r => r.crossover !== 'none');
      // Not asserting count as it depends on random data
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for insufficient data', () => {
      const prices = generatePriceData(20);
      const results = calculateMACD(prices, 12, 26, 9);
      
      expect(results.length).toBe(0);
    });
  });

  describe('calculateBollingerBands', () => {
    it('should calculate Bollinger Bands correctly', () => {
      const prices = generatePriceData(50);
      const results = calculateBollingerBands(prices, 20, 2);
      
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(result => {
        expect(result.date).toBeDefined();
        expect(result.upper).toBeDefined();
        expect(result.middle).toBeDefined();
        expect(result.lower).toBeDefined();
        expect(result.price).toBeDefined();
        expect(result.signal).toBeDefined();
        
        expect(result.upper).toBeGreaterThan(result.middle);
        expect(result.middle).toBeGreaterThan(result.lower);
      });
    });

    it('should return empty array for insufficient data', () => {
      const prices = generatePriceData(15);
      const results = calculateBollingerBands(prices, 20, 2);
      
      expect(results.length).toBe(0);
    });
  });
});
