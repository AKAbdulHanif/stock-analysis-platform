import { describe, it, expect } from 'vitest';
import { screenStocks, getPresetScreens, type ScreenCriteria } from './stockScreenerService';

describe('stockScreenerService', () => {
  describe('screenStocks', () => {
    it('should filter stocks by market cap', async () => {
      const criteria: ScreenCriteria = {
        minMarketCap: 100000000000, // 100B
      };
      
      const results = await screenStocks(criteria);
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach(stock => {
        if (stock.marketCap) {
          expect(stock.marketCap).toBeGreaterThanOrEqual(100000000000);
        }
      });
    });

    it('should filter stocks by PE ratio', async () => {
      const criteria: ScreenCriteria = {
        maxPE: 20,
      };
      
      const results = await screenStocks(criteria);
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach(stock => {
        if (stock.peRatio) {
          expect(stock.peRatio).toBeLessThanOrEqual(20);
        }
      });
    });

    it('should filter stocks by dividend yield', async () => {
      const criteria: ScreenCriteria = {
        minDividendYield: 2,
      };
      
      const results = await screenStocks(criteria);
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach(stock => {
        if (stock.dividendYield) {
          expect(stock.dividendYield).toBeGreaterThanOrEqual(2);
        }
      });
    });

    it('should filter stocks by sector', async () => {
      const criteria: ScreenCriteria = {
        sectors: ['Technology'],
      };
      
      const results = await screenStocks(criteria);
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach(stock => {
        expect(stock.sector).toBe('Technology');
      });
    });
  });

  describe('getPresetScreens', () => {
    it('should return preset screens', () => {
      const presets = getPresetScreens();
      
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
      
      presets.forEach(preset => {
        expect(preset.id).toBeDefined();
        expect(preset.name).toBeDefined();
        expect(preset.description).toBeDefined();
        expect(preset.criteria).toBeDefined();
      });
    });
  });
});
