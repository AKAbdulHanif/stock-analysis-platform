import { describe, it, expect } from 'vitest';
import { compareStocks } from './stockComparisonService';

describe('stockComparisonService', () => {
  it('should compare multiple stocks', async () => {
    const tickers = ['AAPL', 'GOOGL', 'MSFT'];
    
    const comparison = await compareStocks(tickers);
    
    expect(comparison).toBeDefined();
    expect(Array.isArray(comparison.stocks)).toBe(true);
    expect(comparison.stocks.length).toBe(3);
  });

  it('should handle single stock', async () => {
    const tickers = ['AAPL'];
    
    const comparison = await compareStocks(tickers);
    
    expect(comparison.stocks.length).toBe(1);
  });
});
