import { describe, it, expect } from 'vitest';
import {
  calculateBlackScholes,
  calculateCoveredCall,
  calculateProtectivePut,
  generateCoveredCallPayoff,
  generateProtectivePutPayoff,
  type BlackScholesParams,
} from './optionsStrategyService';

describe('optionsStrategyService', () => {
  describe('calculateBlackScholes', () => {
    it('should calculate call and put prices correctly', () => {
      const params: BlackScholesParams = {
        stockPrice: 100,
        strikePrice: 100,
        timeToExpiry: 1,
        riskFreeRate: 0.05,
        volatility: 0.2,
      };

      const result = calculateBlackScholes(params);

      expect(result.call).toBeGreaterThan(0);
      expect(result.put).toBeGreaterThan(0);
      expect(Math.abs(result.call - result.put)).toBeLessThan(5);
    });

    it('should calculate Greeks correctly', () => {
      const params: BlackScholesParams = {
        stockPrice: 100,
        strikePrice: 100,
        timeToExpiry: 1,
        riskFreeRate: 0.05,
        volatility: 0.2,
      };

      const result = calculateBlackScholes(params);

      expect(result.greeks.call.delta).toBeGreaterThan(0);
      expect(result.greeks.call.delta).toBeLessThan(1);
      expect(result.greeks.put.delta).toBeGreaterThan(-1);
      expect(result.greeks.put.delta).toBeLessThan(0);
      expect(result.greeks.call.gamma).toBeGreaterThan(0);
      expect(result.greeks.put.gamma).toBeGreaterThan(0);
    });

    it('should handle dividend yield correctly', () => {
      const paramsNoDividend: BlackScholesParams = {
        stockPrice: 100,
        strikePrice: 100,
        timeToExpiry: 1,
        riskFreeRate: 0.05,
        volatility: 0.2,
        dividendYield: 0,
      };

      const paramsWithDividend: BlackScholesParams = {
        ...paramsNoDividend,
        dividendYield: 0.02,
      };

      const resultNoDividend = calculateBlackScholes(paramsNoDividend);
      const resultWithDividend = calculateBlackScholes(paramsWithDividend);

      expect(resultWithDividend.call).toBeLessThan(resultNoDividend.call);
      expect(resultWithDividend.put).toBeGreaterThan(resultNoDividend.put);
    });
  });

  describe('calculateCoveredCall', () => {
    it('should calculate covered call metrics correctly', () => {
      const result = calculateCoveredCall(100, 105, 0.25, 0.05, 0.2);

      expect(result.strategy).toBe('covered_call');
      expect(result.premium).toBeGreaterThan(0);
      expect(result.maxProfit).toBeGreaterThan(0);
      expect(result.maxLoss).toBeLessThan(0);
      expect(result.breakEven).toBeLessThan(100);
    });
  });

  describe('calculateProtectivePut', () => {
    it('should calculate protective put metrics correctly', () => {
      const result = calculateProtectivePut(100, 95, 0.25, 0.05, 0.2);

      expect(result.strategy).toBe('protective_put');
      expect(result.premium).toBeGreaterThan(0);
      expect(result.protection).toBeCloseTo(5, 0);
      expect(result.breakEven).toBeGreaterThan(100);
    });
  });

  describe('generateCoveredCallPayoff', () => {
    it('should generate payoff points correctly', () => {
      const payoff = generateCoveredCallPayoff(100, 105, 300, 10);
      
      expect(payoff.length).toBeGreaterThan(0);
      payoff.forEach(point => {
        expect(point.stockPrice).toBeDefined();
        expect(point.profit).toBeDefined();
      });
    });
  });

  describe('generateProtectivePutPayoff', () => {
    it('should generate payoff points correctly', () => {
      const payoff = generateProtectivePutPayoff(100, 95, 200, 10);
      
      expect(payoff.length).toBeGreaterThan(0);
      payoff.forEach(point => {
        expect(point.stockPrice).toBeDefined();
        expect(point.profit).toBeDefined();
      });
    });
  });
});
