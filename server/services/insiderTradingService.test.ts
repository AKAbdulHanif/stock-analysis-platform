import { describe, it, expect, vi } from 'vitest';
import { getInsiderTransactions, analyzeInsiderSentiment } from './insiderTradingService';

// Mock the dataApi
vi.mock('../_core/dataApi', () => ({
  callDataApi: vi.fn().mockResolvedValue({
    quoteSummary: {
      result: [{
        insiderTransactions: {
          transactions: []
        }
      }]
    }
  })
}));

describe('insiderTradingService', () => {
  it('should fetch insider transactions', async () => {
    const transactions = await getInsiderTransactions('AAPL');
    
    expect(Array.isArray(transactions)).toBe(true);
  });

  it('should analyze insider sentiment', async () => {
    const sentiment = await analyzeInsiderSentiment('AAPL');
    
    expect(sentiment).toBeDefined();
    expect(sentiment.ticker).toBe('AAPL');
    expect(sentiment.overallSentiment).toBeDefined();
  });
});
